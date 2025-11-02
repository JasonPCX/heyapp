import React, { useState } from "react";
import { useParams } from "react-router";
import { SidebarInset } from "@/components/ui/sidebar";

import NoChatSelectedPlaceholder from "@/components/chats/no-chat-selected-placeholder";
import ChatContainer from "@/components/chats/chat-container";

function Chats() {
  const { chatId } = useParams();

  const isSelectedChatId = chatId !== undefined && chatId !== null;

  return (
    <SidebarInset>
      {isSelectedChatId ? (
        <ChatContainer chatId={chatId} />
      ) : (
        <NoChatSelectedPlaceholder />
      )}
    </SidebarInset>
  );
}

export default Chats;
