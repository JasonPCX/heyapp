import { useCallback, useEffect } from 'react';
import { useBoundStore } from '@/stores/useBoundStore';

interface UseMediaControlsProps {
  localStream: MediaStream | null;
}

export function useMediaControls({ localStream }: UseMediaControlsProps) {
  const isAudioEnabled = useBoundStore((state) => state.isAudioEnabled);
  const isVideoEnabled = useBoundStore((state) => state.isVideoEnabled);
  const setAudioEnabled = useBoundStore((state) => state.setAudioEnabled);
  const setVideoEnabled = useBoundStore((state) => state.setVideoEnabled);

  // Sync audio track state with store
  useEffect(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isAudioEnabled;
      }
    }
  }, [localStream, isAudioEnabled]);

  // Sync video track state with store
  useEffect(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoEnabled;
      }
    }
  }, [localStream, isVideoEnabled]);

  const toggleMute = useCallback(() => {
    setAudioEnabled(!isAudioEnabled);
  }, [isAudioEnabled, setAudioEnabled]);

  const toggleVideo = useCallback(() => {
    setVideoEnabled(!isVideoEnabled);
  }, [isVideoEnabled, setVideoEnabled]);

  return {
    isAudioEnabled,
    isVideoEnabled,
    toggleMute,
    toggleVideo,
  };
}