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
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getInitials } from "@/lib/utils";

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
        <div className="flex items-center justify-between">
          <h1 className="text-foreground text-base font-medium">Chats</h1>
          {/* TODO: Implement unread filter logic */}
          <Label className="flex items-center gap-2 text-sm">
            <span>Unreads</span>
            <Switch className="shadow-none" />
          </Label>
        </div>
        <SidebarInput placeholder="Search conversations..." />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            {isLoading && (
              <div className="flex flex-col space-y-3 p-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 animate-pulse"
                  >
                    <div className="size-11 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-24" />
                      <div className="h-3 bg-muted rounded w-32" />
                    </div>
                    <div className="h-3 bg-muted rounded w-12" />
                  </div>
                ))}
              </div>
            )}
            {chatList.length === 0 && (
              <div className="flex-1 flex items-center justify-center p-8">
                <span className="text-muted-foreground text-center text-sm">
                  No chats yet. Start a new conversation with your friends to
                  get started.
                </span>
              </div>
            )}
            {chatList.length > 0 &&
              chatList.map((chat) => (
                <NavLink
                  to={`/chats/${chat.id}`}
                  key={chat.id}
                  className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-row items-center gap-4 border-b p-3 text-sm leading-tight whitespace-nowrap last:border-b-0 w-full"
                >
                  {/* Avatar */}
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="#" alt={chat.friendUserName} />
                    <AvatarFallback className="rounded-lg bg-gray-800 text-white">
                      {getInitials(chat.friendUserName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex flex-col w-full items-start">
                    <div className="flex flex-row justify-between items-center gap-2">
                      <h3
                        className="text-lg font-semibold"
                        title={chat.friendUserName}
                      >
                        {chat.friendUserName}
                      </h3>{" "}
                      <time
                        className="text-xs"
                        title={chat.lastMessageAtFormatted || ""}
                      >
                        {chat.lastMessageAtFormatted?.trim()
                          ? chat.lastMessageAtFormatted
                          : ""}
                      </time>
                    </div>
                    <p
                      className="line-clamp-1 text-base whitespace-break-spaces text-muted-foreground hover:text-muted-foreground/90 transition-colors"
                      title={chat.lastMessageText}
                    >
                      {chat.lastMessageText?.trim() ? (
                        <>
                          <span className="font-medium">You:</span>
                          {chat.lastMessageText}
                        </>
                      ) : (
                        <span className="italic">No messages yet</span>
                      )}
                    </p>
                  </div>
                </NavLink>
              ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}

export default ChatsSidebar;
