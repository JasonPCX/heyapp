import { useEffect, useRef } from 'react';

interface VideoStreamProps {
  stream: MediaStream | null;
  label: string;
  className?: string;
  autoPlay?: boolean;
  playsInline?: boolean;
}

export function VideoStream({ 
  stream, 
  label, 
  className = "bg-black rounded-2xl",
  autoPlay = true,
  playsInline = true 
}: VideoStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className={className}
        autoPlay={autoPlay}
        playsInline={playsInline}
        muted={label === "You"} // Mute local video to prevent feedback
      />
      <h3 className="absolute bottom-2 right-4 text-shadow-accent text-white">
        {label}
      </h3>
    </div>
  );
}