import type { StateCreator } from "zustand";
import type { CallStatus, CallType } from "@/config/webrtc";

export type CallInformation = {
  callId: string | null;
  caller: {
    id: string;
    name: string;
  };
  chatId: string | null;
  callOffer?: RTCSessionDescriptionInit;
};

const defaultCallInfo: CallInformation = {
  callId: null,
  caller: {
    id: "",
    name: "",
  },
  chatId: null,
};

export type State = {
  // Incoming call state
  incomingCall: boolean;
  callInformation: CallInformation;
  
  // Active call state
  activeCallId: string | null;
  callStatus: CallStatus;
  callType: CallType | null;
  remoteUserId: string | null;
  remoteUserName: string | null;
  
  // Media state
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  
  // Connection state
  connectionState: RTCPeerConnectionState | null;
};

export type Actions = {
  // Incoming call actions
  setIncomingCallInfo: (callInfo: CallInformation) => void;
  clearIncomingCallInfo: () => void;
  
  // Active call actions
  setActiveCall: (callId: string, type: CallType, remoteUserId: string, remoteUserName: string) => void;
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
  callInformation: defaultCallInfo,
  
  // Active call state
  activeCallId: null,
  callStatus: 'idle',
  callType: null,
  remoteUserId: null,
  remoteUserName: null,
  
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
  setIncomingCallInfo: (callInfo: CallInformation) =>
    set((state: any) => {
      state.incomingCall = true;
      state.callInformation = callInfo;
    }),
    
  clearIncomingCallInfo: () =>
    set((state: any) => {
      state.incomingCall = false;
      state.callInformation = defaultCallInfo;
    }),
    
  // Active call actions
  setActiveCall: (callId: string, type: CallType, remoteUserId: string, remoteUserName: string) =>
    set((state: any) => {
      state.activeCallId = callId;
      state.callType = type;
      state.remoteUserId = remoteUserId;
      state.remoteUserName = remoteUserName;
      state.callStatus = 'initializing';
    }),
    
  setCallStatus: (status: CallStatus) =>
    set((state: any) => {
      state.callStatus = status;
    }),
    
  setConnectionState: (connectionState: RTCPeerConnectionState) =>
    set((state: any) => {
      state.connectionState = connectionState;
      if (connectionState === 'connected') {
        state.callStatus = 'connected';
      } else if (connectionState === 'failed' || connectionState === 'disconnected') {
        state.callStatus = 'failed';
      }
    }),
    
  endCall: () =>
    set((state: any) => {
      state.activeCallId = null;
      state.callType = null;
      state.remoteUserId = null;
      state.remoteUserName = null;
      state.callStatus = 'ended';
      state.connectionState = null;
      state.isVideoEnabled = true;
      state.isAudioEnabled = true;
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
