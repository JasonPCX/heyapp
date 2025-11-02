import React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { FriendRequest } from "@/types";
import { Button } from "../ui/button";
import { UserCheck, UserX } from "lucide-react";

function NewFriendRequestDialog({
  open,
  setOpen,
  newFriendRequest,
  onAcceptFriendRequest,
  onRejectFriendRequest,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  newFriendRequest: FriendRequest | null;
  onAcceptFriendRequest: (requestId: string) => void;
  onRejectFriendRequest: (requestId: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center uppercase">
            New friend request
          </DialogTitle>
          <DialogDescription className="hidden">
            You just received a new friend request
          </DialogDescription>
        </DialogHeader>
        {newFriendRequest && (
          <>
            <div className="flex flex-col justify-center items-center">
              <h1 className="text-2xl font-bold">
                {newFriendRequest?.sender.name}
              </h1>
            </div>
            <div className="w-full max-w-[275px] flex mx-auto gap-3">
              <Button
                variant="default"
                size="lg"
                className="flex-1 w-full"
                onClick={() => onAcceptFriendRequest(newFriendRequest.id)}
              >
                <UserCheck className="mr-2" />
                Accept
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 w-full"
                onClick={() => onRejectFriendRequest(newFriendRequest.id)}
              >
                <UserX className="mr-2" />
                Decline
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default NewFriendRequestDialog;
