import React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { CallInformation } from "@/stores/callSlice";
import { Button } from "../ui/button";
import { Phone, PhoneOff, Video } from "lucide-react";

function IncomingCallDialog({
  open,
  setOpen,
  remoteUserId,
  remoteUserName,
  onAnswer,
  onHangUp,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  remoteUserId: string | null;
  remoteUserName: string | null;
  onHangUp: () => void;
  onAnswer: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-center space-y-4">
          <AlertDialogTitle asChild>
            <h1 className="text-3xl font-bold text-center">
              {remoteUserName}
            </h1>
          </AlertDialogTitle>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Video className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogDescription className="text-center text-lg mb-6">
          Incoming video call
        </AlertDialogDescription>
        <AlertDialogFooter className="flex flex-row justify-center items-center gap-8 w-full">
          <Button
            variant="destructive"
            size="icon"
            aria-label="Decline call"
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg transition-all duration-200 hover:scale-105"
            onClick={onHangUp}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
          <Button
            variant="default"
            size="icon"
            aria-label="Answer call"
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 shadow-lg transition-all duration-200 hover:scale-105"
            onClick={onAnswer}
          >
            <Phone className="w-6 h-6" />
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default IncomingCallDialog;
