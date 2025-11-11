import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useSidebar } from "@/components/ui/sidebar";
import { useChat } from "@/hooks/use-chats";
import socket from "@/lib/sockets";
import { useBoundStore } from "@/stores/useBoundStore";
import { toast } from "sonner";
import { VideoStream } from "@/components/calls/video-stream";
import { useMediaControls } from "@/hooks/use-media-controls";
import { CallControls } from "@/components/calls/call-controls";
import { CALL_SOCKET_EVENTS, WEBRTC_CONFIG } from "@/config/webrtc";

function Call() {
  const { chatId, callId } = useParams();
  const navigate = useNavigate();
  const { setOpen } = useSidebar();

  // Ref for local video element
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  // Ref for remote video element
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // Refs for local media stream
  const localStreamRef = useRef<MediaStream | null>(null);
  // Ref for remote media stream
  const remoteStreamRef = useRef<MediaStream>(new MediaStream());
  // Ref for RTCPeerConnection (will be created fresh in effect)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  // Perfect-negotiation flags as refs (avoid render/state timing issues)
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const isSettingRemoteAnswerPendingRef = useRef(false);
  // isPolitePeer from store
  const isPolitePeer = useBoundStore((state) => state.isPolitePeer);
  const endCall = useBoundStore((state) => state.endCall);
  // State for peer connection status
  const [peerConnectionState, setPeerConnectionState] =
    useState<RTCPeerConnectionState | null>(null);
  // State for signaling state
  const [signalingState, setSignalingState] =
    useState<RTCSignalingState | null>(null);

  // Keep a stateful copy of the local stream so hooks re-run when it's ready
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const { isAudioEnabled, isVideoEnabled, toggleMute, toggleVideo } =
    useMediaControls({ localStream });

  // If no chatId or callId, redirect to chats page
  // Redirect if params are missing
  useEffect(() => {
    if (!chatId || !callId) {
      navigate("/chats", { replace: true });
    }
  }, [chatId, callId, navigate]);

  // Fetch individual chat details
  const { data: chatDetails } = useChat(chatId!);

  // Extract receiver info for direct chats (avoids repeated type narrowing)
  const receiverUserInfo =
    chatDetails?.chatType === "direct" ? chatDetails.receiverUserInfo : null;

  // Function to return to chat messaging page
  function onReturnToChat() {
    // When returning to chat, open the sidebar and navigate back
    setOpen(true);
    navigate(`/chats/${chatId}`);
  }

  // Get chat type
  const chatType = chatDetails?.chatType;

  // If chat is a group, show error and return to chat (side-effectfully)
  useEffect(() => {
    if (chatType === "group") {
      toast.error("Calls are not available for group chats");
      onReturnToChat();
    }
  }, [chatType]);

  // Once component is mounted, close sidebar
  useEffect(() => {
    setOpen(false);
  }, []);

  function stopAndRemoveLocalMediaStream() {
    const stream = localStreamRef.current;
    if (!stream) return;

    stream.getTracks().forEach((track) => {
      track.stop();
      stream.removeTrack(track);
    });
  }

  useEffect(() => {
    // Don't run until chat details are loaded and params are present
    if (!chatDetails || !chatId || !callId) return;

    // Create a fresh peer connection for this call
    peerConnectionRef.current = new RTCPeerConnection(
      WEBRTC_CONFIG.STUN_SERVERS
    );
    const peerConnection = peerConnectionRef.current;
    // Queue for early ICE candidates
    let queuedIceCandidates: RTCIceCandidateInit[] = [];

    async function processQueuedIceCandidates() {
      for (const candidate of queuedIceCandidates) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error("Error adding queued ICE candidate: ", error);
        }
      }
      queuedIceCandidates = [];
    }

    // 1
    // -- Enabling multimedia capture
    // - Obtain media stream from user devices
    // - Resulting stream is stored in localStreamRef
    // - Tracks from this stream are added to the peer connection
    const openMediaDevices = async () => {
      try {
        localStreamRef.current = await navigator.mediaDevices.getUserMedia(
          WEBRTC_CONFIG.MEDIA_CONSTRAINTS
        );
        setLocalStream(localStreamRef.current);

        // Show stream in HTML video AFTER we have the stream
        if (selfVideoRef.current && localStreamRef.current) {
          selfVideoRef.current.srcObject = localStreamRef.current;
        }

        localStreamRef.current
          ?.getTracks()
          .forEach((track: MediaStreamTrack) => {
            if (peerConnection.signalingState !== "closed") {
              peerConnection.addTrack(track, localStreamRef.current!);
            }
          });
      } catch (error) {
        console.error("Error accessing media devices:", error);
        toast.error("Could not access camera/microphone");
      }
    };

    // Start opening media devices and store the promise
    openMediaDevices();

    // 2
    // -- Handling inbound media stream from remote peer
    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current.addTrack(track);
      });

      // Assign remote stream to video element when tracks are received
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    };

    // 3
    // Get a local descriptor and send it to the remote peer
    peerConnection.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true;
        await peerConnection.setLocalDescription();

        socket.emit(CALL_SOCKET_EVENTS.CALL_NEGOTIATION, {
          callId: callId,
          description: peerConnection.localDescription,
        });
      } catch (error) {
        console.error("Error during negotiationneeded:", error);
      } finally {
        makingOfferRef.current = false;
      }
    };

    // 4
    // Handle received ICE candidates
    peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit(CALL_SOCKET_EVENTS.CALL_CANDIDATE, {
          iceCandidate: candidate,
          callId,
        });
      }
    };

    // 5
    // - On receiving a description from remote peer
    socket.on(CALL_SOCKET_EVENTS.CALL_DESCRIPTION_NEW, async (description) => {
      try {
        // Check if we're ready to accept an offer (not making our own offer and in stable state)
        const readyForOffer =
          !makingOfferRef.current &&
          (peerConnection.signalingState === "stable" ||
            isSettingRemoteAnswerPendingRef.current);
        // Detect offer collision: incoming offer when we're not ready
        const offerCollision = description.type === "offer" && !readyForOffer;

        // Impolite peer ignores colliding offers to avoid error noise
        const shouldIgnore = !isPolitePeer && offerCollision;
        ignoreOfferRef.current = shouldIgnore;
        if (shouldIgnore) return;

        // Track if we're setting a remote answer to avoid race conditions
        isSettingRemoteAnswerPendingRef.current = description.type === "answer";

        // Set the remote description to inform WebRTC about the other peer's configuration
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(description)
        );

        // Process any queued ICE candidates now that remote description is set
        await processQueuedIceCandidates();

        // Clear the pending flag after processing
        isSettingRemoteAnswerPendingRef.current = false;

        // If we received an offer, generate and send an answer
        if (description.type === "offer") {
          // Automatically generate an appropriate answer for the received offer
          await peerConnection.setLocalDescription();
          // Send the answer back through the signaling channel
          socket.emit(CALL_SOCKET_EVENTS.CALL_NEGOTIATION, {
            callId: callId,
            description: peerConnection.localDescription,
          });
        }
      } catch (error) {
        console.error("Error handling new description: ", error);
      }
    });

    // 6
    // - On receiving a new ICE candidate from remote peer
    socket.on(CALL_SOCKET_EVENTS.CALL_CANDIDATE_NEW, async (candidate) => {
      try {
        if (candidate && peerConnection.remoteDescription) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          // Queue the candidate if remote description is not set yet
          queuedIceCandidates.push(candidate);
        }
      } catch (error) {
        console.error("Error adding ICE candidate: ", error);
      }
    });

    peerConnection.onconnectionstatechange = (_event) => {
      setPeerConnectionState(peerConnection.connectionState);
      if (peerConnection.connectionState === "connected") {
        toast.success("Call connected successfully!");
      } else if (peerConnection.connectionState === "failed") {
        toast.error("Call connection failed");
      } else if (peerConnection.connectionState === "closed") {
        stopAndRemoveLocalMediaStream();
        setLocalStream(null);
      }
    };

    peerConnection.onsignalingstatechange = (_event) => {
      setSignalingState(peerConnection.signalingState);
    }

    // Listen on call hang up
    socket.on(CALL_SOCKET_EVENTS.CALL_ENDED, () => {
      onReturnToChat();
    });

    // Listen on call cancellation (for when the caller cancels before connection)
    socket.on(CALL_SOCKET_EVENTS.CALL_CANCELLED, () => {
      toast.info("Call was cancelled");
      onReturnToChat();
    });

    // Create cleanup function
    const cleanup = () => {
      // Clean up socket listeners
      socket.off(CALL_SOCKET_EVENTS.CALL_DESCRIPTION_NEW);
      socket.off(CALL_SOCKET_EVENTS.CALL_CANDIDATE_NEW);
      socket.off(CALL_SOCKET_EVENTS.CALL_ENDED);
      socket.off(CALL_SOCKET_EVENTS.CALL_CANCELLED);

      // Clean up media streams
      stopAndRemoveLocalMediaStream();
      setLocalStream(null);

      // Clean up peer connection
      if (peerConnection.connectionState !== "closed") {
        peerConnection.close();
      }
    };
    return cleanup;
  }, [callId, chatId, chatDetails]);

  // Function to hang up the call
  function onHangUp() {
    // If peer connection exists, close it
    if (
      peerConnectionRef.current &&
      peerConnectionRef.current.connectionState !== "closed"
    ) {
      peerConnectionRef.current.close();
    }
    // Stop local media tracks
    stopAndRemoveLocalMediaStream();
    setLocalStream(null);
    // Clear video stream references
    if (selfVideoRef.current) {
      selfVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // If call hasn't been established (still negotiating), cancel it instead of ending
    const isCallEstablished = peerConnectionState === "connected";
    
    if (isCallEstablished) {
      // Notify server about call end
      socket.emit(CALL_SOCKET_EVENTS.CALL_END, { callId });
      toast.info("Call ended");
    } else {
      // Notify server about call cancellation
      socket.emit(CALL_SOCKET_EVENTS.CALL_CANCEL, { callId });
      toast.info("Call cancelled");
    }

    // Update store to clear call state
    endCall();
    // Navigate back to chat
    onReturnToChat();
  }

  // Get call type from store  
  const callType = useBoundStore((state) => state.callType);

  return (
    <div className="w-full grid place-items-center">
      <div>
        {isPolitePeer ? "Polite Peer" : "Impolite Peer"}
        {signalingState && <span> - Signaling State: {signalingState}</span>}
        {peerConnectionState && (<span> - Connection State: {peerConnectionState}</span>)}
      </div>
      <div className="w-full max-w-3xl space-y-4 flex flex-col justify-center items-center">
        <span className="text-xl">
          {peerConnectionState === "connected" ? (
            <>Connected with <span className="font-bold">{receiverUserInfo?.userName ?? ""}</span></>
          ) : callType === "outgoing" ? (
            <>Calling <span className="font-bold">{receiverUserInfo?.userName ?? ""}...</span></>
          ) : (
            <>Call with <span className="font-bold">{receiverUserInfo?.userName ?? ""}</span></>
          )}
        </span>

        <div className="w-full flex flex-col justify-center items-center gap-4 bg-accent rounded-xl px-6 py-4 max-h-screen">
          <VideoStream
            ref={remoteVideoRef}
            label={receiverUserInfo?.userName ?? ""}
            autoPlay
            playsInline
            isVideoEnabled={true} // TODO: manage remote video state
            isAudioEnabled={true} // TODO: manage remote audio state
          />
          <VideoStream 
            ref={selfVideoRef} 
            label="You" 
            autoPlay 
            playsInline 
            isVideoEnabled={isVideoEnabled}
            isAudioEnabled={isAudioEnabled}
          />
        </div>

        <CallControls
          canReturnToChat={signalingState === "closed"}
          onHangUp={onHangUp}
          onReturnToChat={onReturnToChat}
          isMuted={!isAudioEnabled}
          isVideoOff={!isVideoEnabled}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
        />
      </div>
    </div>
  );
}

export default Call;
