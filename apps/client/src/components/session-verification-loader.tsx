import { Spinner } from "./ui/spinner";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";

interface SessionVerificationLoaderProps {
  className?: string;
  message?: string;
}

function SessionVerificationLoader({
  className,
  message = "Verifying session...",
}: SessionVerificationLoaderProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50",
        className
      )}
    >
      <div className="w-full max-w-sm mx-4 border-border/50">
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <Spinner className="size-8" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium text-foreground">{message}</h3>
            <p className="text-sm text-muted-foreground">
              Please wait a moment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { SessionVerificationLoader };
