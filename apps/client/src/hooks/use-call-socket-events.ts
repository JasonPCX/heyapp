import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import socket from '@/lib/sockets';

interface UseCallSocketEventsProps {
  callId: string | undefined;
  chatId: string;
  callIdentifierRef: React.MutableRefObject<string | null>;
  peerConnection: React.MutableRefObject<RTCPeerConnection | null>;
  onCallEnded: () => void;
}

export function useCallSocketEvents({
  callId,
  chatId,
  callIdentifierRef,
  peerConnection,
  onCallEnded,
}: UseCallSocketEventsProps) {
  const queuedCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const processQueuedCandidates = useCallback(async () => {
    const pc = peerConnection.current;
    if (pc?.remoteDescription && queuedCandidatesRef.current.length > 0) {
      for (const candidateInit of queuedCandidatesRef.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
        } catch (error) {
          console.error("Error adding queued ICE candidate:", error);
        }
      }
      queuedCandidatesRef.current = [];
    }
  }, [peerConnection]);

  const makeCall = useCallback(async (receiverUserId: string) => {
    const pc = peerConnection.current;
    if (!pc) return;

    try {
      let currentCallId: string | null = null;

      pc.onicecandidate = (event) => {
        if (event.candidate && currentCallId) {
          socket.emit("call:candidate", {
            type: "offerCandidate",
            iceCandidate: event.candidate.toJSON(),
            callId: currentCallId,
          });
        }
      };

      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      const response = await socket.emitWithAck("call:new", {
        to: receiverUserId,
        offer: offerDescription,
        chatId,
      });

      if (response?.status === "ERROR") {
        switch (response.errorCode) {
          case "USER_OFFLINE":
            toast.info("User is offline. Try to call your friend later");
            onCallEnded();
            return;
          default:
            toast.error("Call failed: " + response.errorCode);
            break;
        }
        return;
      }

      currentCallId = response?.status === "SUCCESS" ? response.callId : null;
      if (currentCallId) {
        callIdentifierRef.current = currentCallId;
        console.log("Call ID set:", currentCallId);
      }

    } catch (error) {
      console.error("Error in makeCall:", error);
      toast.error("Failed to initiate call");
    }
  }, [chatId, callIdentifierRef, onCallEnded, peerConnection]);

  const answerCall = useCallback(async (callOffer: RTCSessionDescriptionInit) => {
    const pc = peerConnection.current;
    if (!pc || !callId) return;

    try {
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("call:candidate", {
            callId,
            type: "answerCandidate",
            iceCandidate: event.candidate.toJSON(),
          });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(callOffer));
      await processQueuedCandidates();

      const answerDescription = await pc.createAnswer();
      await pc.setLocalDescription(answerDescription);

      await socket.emitWithAck("call:answer", {
        answer: answerDescription,
        callId,
        response: "ANSWER",
      });

    } catch (error) {
      console.error("Error in answerCall:", error);
      toast.error("Failed to answer call");
    }
  }, [callId, peerConnection, processQueuedCandidates]);

  useEffect(() => {
    const handleCallAnswered = async (
      _responseCallId: string,
      callResponse: string,
      answerDescription: RTCSessionDescriptionInit | null
    ) => {
      const pc = peerConnection.current;
      if (!pc) return;

      try {
        if (callResponse === "HANGUP") {
          onCallEnded();
          return;
        }
        
        if (callResponse === "ANSWER" && answerDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(answerDescription));
          await processQueuedCandidates();
        }
      } catch (error) {
        console.error("Error handling call answer:", error);
        toast.error("Failed to establish connection");
      }
    };

    const handleCandidateAdded = async (iceCandidate: RTCIceCandidateInit) => {
      const pc = peerConnection.current;
      if (!pc) return;

      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(iceCandidate));
        } else {
          queuedCandidatesRef.current.push(iceCandidate);
        }
      } catch (error) {
        console.error("Error handling ICE candidate:", error);
      }
    };

    const handleCallEnded = () => {
      onCallEnded();
    };

    socket.on("call:answered", handleCallAnswered);
    socket.on("call:candidate:added", handleCandidateAdded);
    socket.on("call:ended", handleCallEnded);

    return () => {
      socket.off("call:answered", handleCallAnswered);
      socket.off("call:candidate:added", handleCandidateAdded);
      socket.off("call:ended", handleCallEnded);
    };
  }, [onCallEnded, peerConnection, processQueuedCandidates]);

  return {
    makeCall,
    answerCall,
  };
}