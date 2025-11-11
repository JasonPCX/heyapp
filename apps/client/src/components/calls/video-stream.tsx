import { MicOff, VideoOff, User } from 'lucide-react';

interface VideoStreamProps {
  ref: React.RefObject<HTMLVideoElement | null>;
  label: string;
  className?: string;
  autoPlay?: boolean;
  playsInline?: boolean;
  isVideoEnabled?: boolean;
  isAudioEnabled?: boolean;
}

export function VideoStream({ 
  ref, 
  label, 
  className = "bg-black rounded-2xl",
  autoPlay = true,
  playsInline = true,
  isVideoEnabled = true,
  isAudioEnabled = true
}: VideoStreamProps) {
  return (
    <div className="relative">
      {/* Video element */}
      <video
        ref={ref}
        className={`${className} ${!isVideoEnabled ? 'opacity-0' : ''}`}
        autoPlay={autoPlay}
        playsInline={playsInline}
        muted={label === "You"} // Mute local video to prevent feedback
      />
      
      {/* Video disabled fallback */}
      {!isVideoEnabled && (
        <div className={`absolute inset-0 ${className} flex flex-col items-center justify-center bg-gray-900`}>
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-300" />
            </div>
            <div className="flex items-center space-x-2 bg-red-500/80 px-3 py-1 rounded-full">
              <VideoOff className="w-4 h-4 text-white" />
              <span className="text-sm text-white">Video off</span>
            </div>
          </div>
        </div>
      )}

      {/* Audio muted indicator */}
      {!isAudioEnabled && (
        <div className="absolute top-2 left-2 bg-red-500/80 px-2 py-1 rounded-full flex items-center space-x-1">
          <MicOff className="w-3 h-3 text-white" />
          <span className="text-xs text-white">Muted</span>
        </div>
      )}
      
      {/* Label */}
      <h3 className="absolute bottom-2 right-4 text-shadow-accent text-white">
        {label}
      </h3>
    </div>
  );
}