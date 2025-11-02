import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useBoundStore } from '@/stores/useBoundStore';
import socket from '@/lib/sockets';

export function useIncomingCalls() {
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const setIncomingCall = useBoundStore((state) => state.setIncomingCallInfo);
  const callInformation = useBoundStore((state) => state.callInformation);

  useEffect(() => {
    const handleIncomingCall = (
      callId: string,
      callOffer: any,
      caller: any,
      chatId: string
    ) => {
      setIncomingCall({
        callId,
        caller,
        callOffer,
        chatId,
      });
      setShowDialog(true);
    };

    socket.on("call:incoming", handleIncomingCall);

    return () => {
      socket.off("call:incoming", handleIncomingCall);
    };
  }, [setIncomingCall]);

  const onAnswer = () => {
    setShowDialog(false);
    navigate(`/chats/${callInformation.chatId}/call/${callInformation.chatId}`);
  };

  const onHangUp = async () => {
    setShowDialog(false);
    await socket.emitWithAck("call:answer", {
      response: "HANGUP",
      callId: callInformation.callId,
      answer: null,
    });
  };

  return {
    showDialog,
    setShowDialog,
    callInformation,
    onAnswer,
    onHangUp,
  };
}