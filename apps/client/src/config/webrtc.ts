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
  | "idle"
  | "initializing"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "failed"
  | "ended";

/**
 * Call Types
 */
export type CallType = "outgoing" | "incoming";

/**
 * Socket Event Names
 */
export const CALL_SOCKET_EVENTS = {
  CALL_NEW: "call:new",
  CALL_CANCEL: "call:cancel",
  CALL_CANCELLED: "call:cancelled",
  CALL_END: "call:end",
  CALL_ENDED: "call:ended",
  CALL_CANDIDATE: "call:candidate",
  CALL_CANDIDATE_NEW: "call:candidate:new",
  CALL_INCOMING: "call:incoming",
  CALL_DESCRIPTION_NEW: "call:description:new",
  CALL_NEGOTIATION: "call:negotiation",
} as const;
