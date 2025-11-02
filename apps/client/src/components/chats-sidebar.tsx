import React, { useEffect } from "react";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { NavLink } from "react-router";
import { useChatsPreview } from "@/hooks/use-chats";

function ChatsSidebar() {
  const { data, isLoading, error, isError } = useChatsPreview();

  const chatList = data?.data ?? [];

  // Handling fetching friends error
  useEffect(() => {
    if (isError) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message);
        return;
      }
    }
  }, [isError, error]);

  return (
    <>
      <SidebarHeader className="gap-3.5 border-b p-4">
        <div className="flex w-full items-center justify-between">
          <div className="text-foreground text-base font-medium">Chats</div>
          {/* TODO: Implement unread filter logic */}
          <Label className="flex items-center gap-2 text-sm">
            <span>Unreads</span>
            <Switch className="shadow-none" />
          </Label>
        </div>
        <SidebarInput placeholder="Type to search..." />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-0">
          <SidebarGroupContent>
            {chatList.length === 0 && (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <span className="text-muted-foreground text-center text-sm">
                      No chats yet. Start a new conversation to get started.
                    </span>
                  </div>
                )}
            {chatList.length > 0 &&
              chatList.map((chat) => (
                <NavLink
                  to={`/chats/${chat.id}`}
                  key={chat.id}
                  className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
                >
                  <div className="flex w-full items-center gap-2">
                    <span className="text-lg font-medium" title={chat.friendUserName}>
                      {chat.friendUserName}
                    </span>{" "}
                    <span
                      className="ml-auto text-xs"
                      title={chat.lastMessageAtFormatted || ""}
                    >
                      {chat.lastMessageAtFormatted?.trim()
                        ? chat.lastMessageAtFormatted
                        : "N/A"}
                    </span>
                  </div>
                  <span
                    className="line-clamp-1 w-[260px] text-base whitespace-break-spaces"
                    title={chat.lastMessageText}
                  >
                    {chat.lastMessageText?.trim()
                      ? chat.lastMessageText
                      : "No messages yet"}
                  </span>
                </NavLink>
              ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}

export default ChatsSidebar;
