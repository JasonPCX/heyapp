import React, { useEffect } from "react";

import type { Message } from "@/types";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useClipboard } from "@/hooks/use-clipboard";
import { toast } from "sonner";

const messageVariants = cva(
  "rounded-lg px-4 py-3 space-y-2 text-base break-words max-w-2/3",
  {
    variants: {
      messageDirection: {
        incoming:
          "text-left self-start rounded-tl-none bg-neutral-300 text-black text-left",
        outgoing:
          "text-right self-end rounded-tr-none bg-neutral-800 text-white",
      },
    },
  }
);

function MessageItem({
  text,
  messageDirection,
  user,
  createdAtFormatted,
}: Message) {
  const { copy, copied } = useClipboard();

  useEffect(() => {
    if (copied) {
      toast.info("Text copied to your clipboard!");
    }
  }, [copied]);

  return (
    <div className={cn(messageVariants({ messageDirection }))}>
      <div className="text-sm space-x-1">
        <span className="font-bold">
          {messageDirection === "outgoing" ? "You" : user?.name}
        </span>
        <span>{createdAtFormatted}</span>
      </div>
      <p onDoubleClick={() => copy(text)} className="whitespace-pre-line">
        {text}
      </p>
    </div>
  );
}

export default MessageItem;
