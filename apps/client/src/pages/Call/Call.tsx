import React, { useEffect, useRef, useCallback, useState } from "react";
import { ArrowLeft, Phone } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useChat } from "@/hooks/use-chats";
import socket from "@/lib/sockets";
import { useBoundStore } from "@/stores/useBoundStore";
import { toast } from "sonner";
import { VideoStream } from "@/components/calls/video-stream";

const stunServers = {
  iceServers: [
    {
      urls: [
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

function Call() {
  const { chatId, callId } = useParams();
  const navigate = useNavigate();
  const { setOpen } = useSidebar();
  // Ref for local video element
  const localStreamRef = useRef<HTMLVideoElement>(null);
  // Ref for remote video element
  const remoteStreamRef = useRef<HTMLVideoElement>(null);
  // Ref for RTCPeerConnection
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  // Ref for call setup state
  const isSetupRef = useRef<string | false>(false);
  // Ref for cleanup function
  const cleanupRef = useRef<(() => void) | null>(null);
  // Ref for call identifier
  const callIdentifierRef = useRef<string | null>(callId || null);
  // State for indicating if call is being received
  const incomingCall = useBoundStore((state) => state.incomingCall);
  // If call is being received, get call information
  const incomingCallInformation = useBoundStore(
    (state) => state.callInformation
  );
  // State for peer connection status
  const [peerConnectionState, setPeerConnectionState] = useState("");

  // If no chatId, redirect to chats page
  if (chatId === undefined || chatId === null) {
    navigate("/chats");
    return;
  }

  // Fetch individual chat details
  const { data: chatDetails, isLoading } = useChat(chatId);

  // Function to return to chat messaging page
  function onReturnToChat() {
    // When returning to chat, open the sidebar and navigate back
    setOpen(true);
    navigate(`/chats/${chatId}`);
  }

  // Get chat type
  const chatType = chatDetails?.chatType;

  // TODO: implement group calls
  // If chat is a group, show error and return to chat
  if (chatType === "group") {
    toast.error("Calls are not available for group chats");
    onReturnToChat();
    return;
  }

  // Once component is mounted, close sidebar
  useEffect(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    // Don't run if chat details aren't loaded yet
    if (!chatDetails) return;

    // Prevent duplicate setups using a unique key based on call state
    const setupKey = `${chatId}-${callId}-${incomingCall}`;
    if (isSetupRef.current === setupKey) return;

    // Clean up any existing connection first
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Mark as setup to prevent duplicate runs
    isSetupRef.current = setupKey;

    const peerConnection = new RTCPeerConnection(stunServers);
    peerConnectionRef.current = peerConnection;
    let localStream: MediaStream | null = null;
    let remoteStream: MediaStream = new MediaStream();
    let isCleanedUp = false;
    // Queue for early ICE candidates
    let queuedIceCandidates: RTCIceCandidateInit[] = [];

    // -- Enabling multimedia capture
    const openMediaDevices = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        // Check if component was unmounted or effect was cleaned up
        if (isCleanedUp) {
          localStream?.getTracks().forEach((track) => track.stop());
          return;
        }

        // Show stream in HTML video AFTER we have the stream
        if (localStreamRef.current && localStream) {
          localStreamRef.current.srcObject = localStream;
        }

        // Push tracks from local stream to peer connection only if it's still open
        if (!isCleanedUp) {
          localStream?.getTracks().forEach((track: MediaStreamTrack) => {
            peerConnection.addTrack(track, localStream!);
          });
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
        toast.error("Could not access camera/microphone");
      }
    };

    // Start opening media devices and store the promise
    const mediaPromise = openMediaDevices();

    // -- Setting up peerConnection event listeners
    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });

      // Assign remote stream to video element when tracks are received
      if (remoteStreamRef.current && !isCleanedUp) {
        remoteStreamRef.current.srcObject = remoteStream;
      }
    };

    peerConnection.onconnectionstatechange = (_event) => {
      setPeerConnectionState(peerConnection.connectionState);
      if (peerConnection.connectionState === "connected") {
        toast.success("Call connected successfully!");
      } else if (peerConnection.connectionState === "failed") {
        toast.error("Call connection failed");
      } else if (peerConnection.connectionState === "closed") {
        localStream?.getTracks().forEach((track) => {
          track.stop();
          localStream?.removeTrack(track);
        });
      }
    };

    // -- Making call
    const makeCall = async () => {
      try {
        // Check if cleanup already happened
        if (isCleanedUp) {
          return;
        }

        // Wait for media devices to be ready first
        await mediaPromise;

        // Double-check connection state before proceeding
        if (isCleanedUp) {
          return;
        }

        // Set up ICE candidate handling BEFORE creating offer
        let currentCallId: string | null = null;

        peerConnection.onicecandidate = (event) => {
          if (event.candidate && currentCallId) {
            socket.emit("call:candidate", {
              type: "offerCandidate",
              iceCandidate: event.candidate.toJSON(),
              callId: currentCallId,
            });
          }
        };

        const offerDescription = await peerConnection.createOffer();

        // Once local description is set, Ice gathering should start
        await peerConnection.setLocalDescription(offerDescription);

        const response = await socket.emitWithAck("call:new", {
          to: chatDetails?.receiverUserInfo.userId,
          offer: offerDescription,
          chatId,
        });

        if (response && response.status && response.status === "ERROR") {
          switch (response.errorCode) {
            case "USER_OFFLINE":
              onReturnToChat();
              toast.info("User is offline. Try to call your friend later");
              return;
            default:
              toast.error("Call failed: " + response.errorCode);
              break;
          }
        }

        // Store the returned call ID from the server response
        currentCallId = response?.status === "SUCCESS" ? response.callId : null;

        if (currentCallId) {
          callIdentifierRef.current = currentCallId;
        }

        socket.on(
          "call:answered",
          async (_responseCallId, callResponse, answerDescription) => {
            try {
              if (callResponse === "HANGUP") {
                onHangUp();
                return;
              }
              if (callResponse === "ANSWER" && !isCleanedUp) {
                await peerConnection.setRemoteDescription(
                  new RTCSessionDescription(answerDescription)
                );

                // Process any queued ICE candidates now that remote description is set
                await processQueuedCandidates();
              }
            } catch (error) {
              console.error("Error setting remote description:", error);
              toast.error("Failed to establish connection");
            }
          }
        );
      } catch (error) {
        console.error("Error in makeCall:", error);
        toast.error("Failed to initiate call");
      }
    };

    const answerCall = async () => {
      try {
        // Check if cleanup already happened
        if (isCleanedUp) {
          return;
        }

        // Wait for media devices to be ready first
        await mediaPromise;

        // Double-check connection state before proceeding
        if (isCleanedUp) {
          return;
        }

        // Set up ICE candidate handling BEFORE setting remote description
        peerConnection.onicecandidate = (event) => {
          if (event.candidate && callId) {
            socket.emit("call:candidate", {
              callId,
              type: "answerCandidate",
              iceCandidate: event.candidate.toJSON(),
            });
          }
        };

        const offerDescription = incomingCallInformation.callOffer;
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offerDescription!)
        );

        // Process any queued ICE candidates now that remote description is set
        await processQueuedCandidates();

        const answerDescription = await peerConnection.createAnswer();

        await peerConnection.setLocalDescription(answerDescription);

        await socket.emitWithAck("call:answer", {
          answer: answerDescription,
          callId,
          response: "ANSWER",
        });
      } catch (error) {
        console.error("Error in answerCall:", error);
        toast.error("Failed to answer call");
      }
    };

    // Decide which action to take
    if (
      chatDetails?.receiverUserInfo.userId !== undefined &&
      chatDetails?.receiverUserInfo.userId !== null &&
      (callId === undefined || callId === null)
    ) {
      makeCall();
    } else if (
      incomingCall === true &&
      callId !== undefined &&
      callId !== null
    ) {
      answerCall();
    }

    // Helper function to process queued ICE candidates
    const processQueuedCandidates = async () => {
      if (peerConnection.remoteDescription && queuedIceCandidates.length > 0) {
        for (const candidateInit of queuedIceCandidates) {
          try {
            await peerConnection.addIceCandidate(
              new RTCIceCandidate(candidateInit)
            );
          } catch (error) {
            console.error("Error adding queued ICE candidate:", error);
          }
        }
        queuedIceCandidates = []; // Clear the queue
      }
    };

    // Listen on new ice candidates
    socket.on("call:candidate:added", async (iceCandidate) => {
      try {
        if (isCleanedUp) {
          return;
        }

        // If remote description is set, add candidate immediately
        if (peerConnection.remoteDescription) {
          const candidate = new RTCIceCandidate(iceCandidate);
          await peerConnection.addIceCandidate(candidate);
        } else {
          // Queue the candidate for later processing
          queuedIceCandidates.push(iceCandidate);
        }
      } catch (error) {
        console.error("Error handling ICE candidate:", error);
      }
    });

    // Listen on call hang up
    socket.on("call:ended", () => {
      onReturnToChat();
    });

    // Create cleanup function
    const cleanup = () => {
      // Set cleanup flag to prevent race conditions
      isCleanedUp = true;
      isSetupRef.current = false;

      // Clean up socket listeners
      socket.off("call:answered");
      socket.off("call:candidate:added");
      socket.off("call:ended");

      // Clean up media streams
      localStream?.getTracks().forEach((track) => {
        track.stop();
        localStream?.removeTrack(track);
      });

      // Clean up peer connection
      if (peerConnection.connectionState !== "closed") {
        peerConnection.close();
      }

      peerConnectionRef.current = null;
    };

    // Store cleanup function for manual cleanup
    cleanupRef.current = cleanup;

    return cleanup;
  }, [
    chatDetails,
    callId,
    incomingCall,
    chatId,
    incomingCallInformation.callOffer,
  ]);

  // Function to hang up the call
  function onHangUp() {
    // If peer connection exists, close it
    if (
      peerConnectionRef.current &&
      peerConnectionRef.current.connectionState !== "closed"
    ) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    // Clear video stream references
    if (localStreamRef.current) {
      localStreamRef.current.srcObject = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.srcObject = null;
    }

    // Notify server about call end
    socket.emit("call:end", callIdentifierRef.current ?? callId);
    // Show call ended toast
    toast.info("Call ended");
    // Navigate back to chat
    onReturnToChat();
  }

  return (
    <div className="w-full grid place-items-center">
      <div className="w-full max-w-3xl space-y-4 flex flex-col justify-center items-center">
        <span className="text-xl">
          Calling{" "}
          <span className="font-bold">
            {chatDetails?.receiverUserInfo.userName}...
          </span>
        </span>

        <div className="w-full flex flex-col justify-center items-center gap-4 bg-accent rounded-xl px-6 py-4 max-h-screen">
          <VideoStream
            ref={remoteStreamRef}
            label={chatDetails?.receiverUserInfo.userName ?? ""}
            autoPlay
            playsInline
          />
          <VideoStream ref={localStreamRef} label="You" autoPlay playsInline />
        </div>

        {peerConnectionState !== "connected" && (
          <Button
            variant="ghost"
            aria-label="Return to chat"
            className="cursor-pointer"
            onClick={onReturnToChat}
          >
            <ArrowLeft />
            Return to chat
          </Button>
        )}
        <div className="space-x-4 flex flex-row justify-center items-center">
          <Button
            variant="default"
            size="icon-lg"
            aria-label="Hang up"
            className="cursor-pointer rounded-full bg-red-500 hover:bg-red-700"
            onClick={onHangUp}
          >
            <Phone />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Call;
