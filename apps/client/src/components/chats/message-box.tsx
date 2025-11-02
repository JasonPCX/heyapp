import React, { useEffect, useId, useRef, useState } from "react";

import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Send } from "lucide-react";
import { useSendMessageMutation } from "@/hooks/use-messages";

interface MessageBoxProps {
  chatId: string;
}

function MessageBox({ chatId }: MessageBoxProps) {
  const [newMessage, setNewMessage] = useState("");
  const messageBoxInputRef = useRef(null);
  const textAreaId = useId();

  const sendMessageMutation = useSendMessageMutation(chatId);

  // Text area input autofocus and reset refs when chat changes
  useEffect(() => {
    if (messageBoxInputRef.current !== null) {
      (messageBoxInputRef.current as HTMLTextAreaElement).focus();
    }
  }, [chatId]);

  function onSendMessage() {
    if (newMessage.trim() === "") {
      return;
    }

    const newMessageData = {
      id: window.crypto.randomUUID(),
      text: newMessage,
      chatId,
    };

    sendMessageMutation.mutate(newMessageData, {
      onSuccess() {
        setNewMessage("");
      },
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.shiftKey === false && e.key === "Enter") {
      e.preventDefault();
      onSendMessage();
    }
  }

  return (
    <div className="bg-background sticky bottom-0 flex shrink-0 gap-2 border-t p-4">
      <Textarea
        ref={messageBoxInputRef}
        id={textAreaId}
        rows={1}
        placeholder="Type your message here."
        className="resize-none"
        value={newMessage}
        onChange={(e) => setNewMessage(e.currentTarget.value)}
        onKeyDown={onKeyDown}
      />
      <Button
        variant="outline"
        size="icon"
        className="rounded-full"
        onClick={onSendMessage}
        disabled={newMessage.trim() === ""}
      >
        <Send />
      </Button>
    </div>
  );
}

export default MessageBox;
