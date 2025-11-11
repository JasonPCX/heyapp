import type { StateCreator } from "zustand";
import type { CallStatus, CallType } from "@/config/webrtc";

export type State = {
  // Incoming call state
  incomingCall: boolean;

  // Active call state
  callId: string | null;
  chatId: string | null;
  callStatus: CallStatus;
  callType: CallType | null;
  remoteUserId: string | null;
  remoteUserName: string | null;
  isPolitePeer: boolean;

  // Media state
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;

  // Connection state
  connectionState: RTCPeerConnectionState | null;
};

export type CallInformation = {
  callId: string | null;
  chatId: string | null;
  callType: CallType | null;
  remoteUserId: string | null;
  remoteUserName: string | null;
  isPolitePeer: boolean;
};

export type Actions = {
  // Incoming call actions
  setIncomingCallInfo: (incomingCall: boolean) => void;

  // Active call actions
  setActiveCall: ({
    callId,
    chatId,
    callType,
    remoteUserId,
    remoteUserName,
    isPolitePeer,
  }: CallInformation) => void;
  setCallStatus: (status: CallStatus) => void;
  setConnectionState: (state: RTCPeerConnectionState) => void;
  endCall: () => void;

  // Media actions
  setVideoEnabled: (enabled: boolean) => void;
  setAudioEnabled: (enabled: boolean) => void;

  // Reset all call state
  resetCallState: () => void;
};

export type CallSlice = State & Actions;

const defaultState: State = {
  // Incoming call state
  incomingCall: false,

  // Active call state
  callId: null,
  chatId: null,
  callStatus: "idle",
  callType: null,
  remoteUserId: null,
  remoteUserName: null,
  isPolitePeer: true,

  // Media state
  isVideoEnabled: true,
  isAudioEnabled: true,

  // Connection state
  connectionState: null,
};

export const createCallSlice: StateCreator<
  any,
  [["zustand/immer", never]],
  [],
  CallSlice
> = (set) => ({
  ...defaultState,

  // Incoming call actions
  setIncomingCallInfo: (incomingCall) =>
    set((state: any) => {
      state.incomingCall = incomingCall;
    }),

  // Active call actions
  setActiveCall: ({
    callId,
    callType,
    remoteUserId,
    remoteUserName,
    isPolitePeer,
    chatId,
  }: CallInformation) =>
    set((state: any) => {
      state.callId = callId;
      state.chatId = chatId;
      state.callType = callType;
      state.remoteUserId = remoteUserId;
      state.remoteUserName = remoteUserName;
      state.callStatus = "initializing";
      state.isPolitePeer = isPolitePeer;
    }),

  setCallStatus: (status: CallStatus) =>
    set((state: any) => {
      state.callStatus = status;
    }),

  setConnectionState: (connectionState: RTCPeerConnectionState) =>
    set((state: any) => {
      state.connectionState = connectionState;
      if (connectionState === "connected") {
        state.callStatus = "connected";
      } else if (
        connectionState === "failed" ||
        connectionState === "disconnected"
      ) {
        state.callStatus = "failed";
      }
    }),

  endCall: () =>
    set((state: any) => {
      state.callId = null;
      state.callType = null;
      state.remoteUserId = null;
      state.remoteUserName = null;
      state.callStatus = "ended";
      state.connectionState = null;
      state.isVideoEnabled = true;
      state.isAudioEnabled = true;
      state.isPolitePeer = true;
    }),

  // Media actions
  setVideoEnabled: (enabled: boolean) =>
    set((state: any) => {
      state.isVideoEnabled = enabled;
    }),

  setAudioEnabled: (enabled: boolean) =>
    set((state: any) => {
      state.isAudioEnabled = enabled;
    }),

  // Reset all call state
  resetCallState: () =>
    set((state: any) => {
      Object.assign(state, defaultState);
    }),
});
