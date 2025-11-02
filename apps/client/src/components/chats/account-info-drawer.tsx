import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ChatInfoResponse } from "@/types/chat";

function AccountInfoDrawer({
  open,
  setOpen,
  chatDetails,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  chatDetails: ChatInfoResponse;
}) {
  if (chatDetails.chatType !== "direct") {
    return null;
  }
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Chat info</SheetTitle>
          <div className="space-y-2 pt-4">
            <h1 className="text-foreground text-gray-800 text-xl font-extrabold">
              {chatDetails.receiverUserInfo.userName}
            </h1>
            <p className="text-gray-500">
              {chatDetails.receiverUserInfo.userEmail}
            </p>
          </div>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}

export default AccountInfoDrawer;
