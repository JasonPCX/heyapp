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
import { Phone } from "lucide-react";

function IncomingCallDialog({
  open,
  setOpen,
  incomingCallInfo,
  onAnswer,
  onHangUp,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  incomingCallInfo: CallInformation;
  onHangUp: () => void;
  onAnswer: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle asChild>
            <h1 className="text-2xl font-bold">
              {incomingCallInfo.caller.name}
            </h1>
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>Incoming video call</AlertDialogDescription>
        <AlertDialogFooter className="flex flex-row justify-center items-center w-full">
          <Button
            variant="default"
            size="icon-lg"
            aria-label="Hang up"
            className="cursor-pointer rounded-full bg-red-500 hover:bg-red-700"
            onClick={onHangUp}
          >
            <Phone />
          </Button>
          <Button
            variant="default"
            size="icon-lg"
            aria-label="Hang up"
            className="cursor-pointer rounded-full bg-green-500 hover:bg-green-700"
            onClick={onAnswer}
          >
            <Phone />
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default IncomingCallDialog;
