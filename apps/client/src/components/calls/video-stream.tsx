import { useEffect, useRef } from 'react';

interface VideoStreamProps {
  ref: React.RefObject<HTMLVideoElement | null>;
  label: string;
  className?: string;
  autoPlay?: boolean;
  playsInline?: boolean;
}

export function VideoStream({ 
  ref, 
  label, 
  className = "bg-black rounded-2xl",
  autoPlay = true,
  playsInline = true 
}: VideoStreamProps) {
  return (
    <div className="relative">
      <video
        ref={ref}
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