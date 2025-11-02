/**
 * WebRTC Configuration Constants
 */

export const WEBRTC_CONFIG = {
  STUN_SERVERS: {
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
  } satisfies RTCConfiguration,
  MEDIA_CONSTRAINTS: {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  },
  CALL_TIMEOUT: 30000, // 30 seconds
  ICE_CONNECTION_TIMEOUT: 10000, // 10 seconds
} as const;

/**
 * Call Status Types
 */
export type CallStatus = 
  | 'idle' 
  | 'initializing' 
  | 'connecting' 
  | 'connected' 
  | 'disconnecting' 
  | 'failed' 
  | 'ended';

/**
 * Call Types
 */
export type CallType = 'outgoing' | 'incoming';

/**
 * Socket Event Names
 */
export const SOCKET_EVENTS = {
  CALL_NEW: 'call:new',
  CALL_ANSWER: 'call:answer',
  CALL_ANSWERED: 'call:answered',
  CALL_END: 'call:end',
  CALL_ENDED: 'call:ended',
  CALL_CANDIDATE: 'call:candidate',
  CALL_CANDIDATE_ADDED: 'call:candidate:added',
  CALL_INCOMING: 'call:incoming',
} as const;