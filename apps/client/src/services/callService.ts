import { toast } from 'sonner';
import socket from '@/lib/sockets';

export class CallService {
  static async endCall(callId: string | null): Promise<void> {
    if (!callId) {
      console.warn('No call ID provided for ending call');
      return;
    }

    try {
      socket.emit("call:end", callId);
      toast.info("Call ended");
    } catch (error) {
      console.error('Error ending call:', error);
      toast.error("Failed to end call properly");
    }
  }

  static async makeCall(params: {
    receiverUserId: string;
    offer: RTCSessionDescriptionInit;
    chatId: string;
  }) {
    try {
      const response = await socket.emitWithAck("call:new", {
        to: params.receiverUserId,
        offer: params.offer,
        chatId: params.chatId,
      });

      return response;
    } catch (error) {
      console.error('Error making call:', error);
      throw error;
    }
  }

  static async answerCall(params: {
    answer: RTCSessionDescriptionInit;
    callId: string;
    response: "ANSWER" | "HANGUP";
  }) {
    try {
      const response = await socket.emitWithAck("call:answer", params);
      return response;
    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  }

  static sendCandidate(params: {
    callId: string;
    type: "offerCandidate" | "answerCandidate";
    iceCandidate: RTCIceCandidateInit;
  }) {
    try {
      socket.emit("call:candidate", params);
    } catch (error) {
      console.error('Error sending ICE candidate:', error);
    }
  }
}