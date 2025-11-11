import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useBoundStore } from "@/stores/useBoundStore";
import socket from "@/lib/sockets";
import type { User } from "@/types";
import { CALL_SOCKET_EVENTS } from "@/config/webrtc";

export function useIncomingCalls() {
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const setActiveCall = useBoundStore((state) => state.setActiveCall);
  const callId = useBoundStore((state) => state.callId);
  const chatId = useBoundStore((state) => state.chatId);
  const remoteUserName = useBoundStore((state) => state.remoteUserName);
  const remoteUserId = useBoundStore((state) => state.remoteUserId);

  useEffect(() => {
    const handleIncomingCall = (
      incomingCallId: string,
      callerUser: User,
      incomingCallChatId: string,
      isPolitePeer: boolean
    ) => {
      setActiveCall({
        callId: incomingCallId,
        chatId: incomingCallChatId,
        callType: "incoming",
        remoteUserId: callerUser.id,
        remoteUserName: callerUser.name,
        isPolitePeer
      });
      setShowDialog(true);
    };

    const handleCallCancelled = (cancelledCallId: string) => {
      // Close the incoming call dialog if the call was cancelled
      if (callId === cancelledCallId) {
        setShowDialog(false);
      }
    };

    socket.on(CALL_SOCKET_EVENTS.CALL_INCOMING, handleIncomingCall);
    socket.on(CALL_SOCKET_EVENTS.CALL_CANCELLED, handleCallCancelled);

    return () => {
      socket.off(CALL_SOCKET_EVENTS.CALL_INCOMING, handleIncomingCall);
      socket.off(CALL_SOCKET_EVENTS.CALL_CANCELLED, handleCallCancelled);
    };
  }, [setActiveCall, callId]);

  const onAnswer = () => {
    setShowDialog(false);
    navigate(`/chats/${chatId}/call/${callId}`);
  };

  const onHangUp = async () => {
    setShowDialog(false);
    await socket.emitWithAck(CALL_SOCKET_EVENTS.CALL_END, {
      response: "HANGUP",
      callId: callId,
      answer: null,
    });
  };

  return {
    showDialog,
    setShowDialog,
    callId,
    chatId,
    onAnswer,
    onHangUp,
    remoteUserName,
    remoteUserId,
  };
}
