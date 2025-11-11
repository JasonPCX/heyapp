import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Mic, MicOff, Video, VideoOff } from "lucide-react";

interface CallControlsProps {
  onHangUp: () => void;
  onReturnToChat: () => void;
  canReturnToChat?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  onToggleMute?: () => void;
  onToggleVideo?: () => void;
}

export function CallControls({
  onHangUp,
  onReturnToChat,
  isMuted = false,
  isVideoOff = false,
  onToggleMute,
  onToggleVideo,
  canReturnToChat,
}: CallControlsProps) {
  return (
    <div className="space-y-4 flex flex-col items-center">
      {canReturnToChat && (
        <Button
          variant="ghost"
          aria-label="Return to chat"
          className="cursor-pointer"
          onClick={onReturnToChat}
        >
          <ArrowLeft />
          Return to chat
        </Button>
      )}

      <div className="space-x-4 flex flex-row justify-center items-center">
        {onToggleMute && (
          <Button
            variant="outline"
            size="icon-lg"
            aria-label={isMuted ? "Unmute" : "Mute"}
            className="cursor-pointer rounded-full"
            onClick={onToggleMute}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </Button>
        )}

        {onToggleVideo && (
          <Button
            variant="outline"
            size="icon-lg"
            aria-label={isVideoOff ? "Turn on video" : "Turn off video"}
            className="cursor-pointer rounded-full"
            onClick={onToggleVideo}
          >
            {isVideoOff ? <VideoOff /> : <Video />}
          </Button>
        )}

        <Button
          variant="default"
          size="icon-lg"
          aria-label="Hang up"
          className="cursor-pointer rounded-full bg-red-500 hover:bg-red-700"
          onClick={onHangUp}
        >
          <Phone />
        </Button>
      </div>
    </div>
  );
}