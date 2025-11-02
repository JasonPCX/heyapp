import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router";
import {
  EllipsisVertical,
  Info,
  MessageCircleX,
  Search,
  Video,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AccountInfoDrawer from "@/components/chats/account-info-drawer";
import type { ChatMessagesResponse } from "@/types/chat";
import { type Message } from "@/types";
import MessageItem from "./message-item";
import MessageBox from "./message-box";
import { useChat, useChats } from "@/hooks/use-chats";
import { isAxiosError } from "axios";

function ChatContainer({ chatId }: { chatId: string }) {
  const navigate = useNavigate();
  const scrollEleRef = useRef(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [openDropdownMenu, setOpenDropdownMenu] = useState(false);
  const [openAccountInfoDrawer, setOpenAccountInfoDrawer] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const lastMessageCountRef = useRef(0);

  // Retrieving chat info
  const { data: chatDetails, isLoading, error } = useChat(chatId);

  // Retrieving chat messages
  const {
    data: messagesPagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChats(chatId);

  const fetchedPages = messagesPagesData?.pages ?? [];
  const fetchedPageParams = messagesPagesData?.pageParams;

  const messagesList = fetchedPages.flatMap(
    (page: ChatMessagesResponse) => page.data
  );

  // Add Escape event listener
  useEffect(() => {
    if (!chatId) return;

    const onKeyDown = (ev: globalThis.KeyboardEvent) => {
      if (ev.defaultPrevented) return;
      if (!ev.shiftKey && ev.key === "Escape") {
        navigate("/chats");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [chatId, navigate]);

  // Catching fetch chat details errors
  useEffect(() => {
    if (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 404 || error.response?.status === 403) {
          navigate("/chats");
        }
      }
    }
  }, [error]);

  // Simple scroll detection
  const isNearBottom = () => {
    if (!messagesContainerRef.current) return false;
    const container = messagesContainerRef.current;
    const threshold = 100;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold
    );
  };

  // Handle scroll to update auto-scroll preference
  const handleScroll = () => {
    setShouldAutoScroll(isNearBottom());
  };

  // Auto-scroll for new messages
  useEffect(() => {
    const currentCount = messagesList.length;
    const previousCount = lastMessageCountRef.current;

    if (currentCount > previousCount && shouldAutoScroll) {
      setTimeout(scrollToBottom, 50);
    }

    lastMessageCountRef.current = currentCount;
  }, [messagesList.length, shouldAutoScroll]);

  // Initial scroll to bottom
  useEffect(() => {
    if (fetchedPageParams !== undefined) {
      const lastPageParam = fetchedPageParams[fetchedPageParams.length - 1];
      if (lastPageParam === 0) {
        scrollToBottom();
        setShouldAutoScroll(true);
      }
    }
  }, [fetchedPageParams]);

  // Reset state when chat changes
  useEffect(() => {
    setShouldAutoScroll(true);
    lastMessageCountRef.current = 0;
  }, [chatId]);

  // Load older messages with simple scroll preservation
  async function onLoadOlderMessages() {
    if (!hasNextPage || !messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const scrollHeight = container.scrollHeight;
    const scrollTop = container.scrollTop;

    // Temporarily disable auto-scroll
    setShouldAutoScroll(false);

    await fetchNextPage();

    // Restore scroll position after DOM updates
    requestAnimationFrame(() => {
      const newScrollHeight = container.scrollHeight;
      const heightDiff = newScrollHeight - scrollHeight;
      container.scrollTop = scrollTop + heightDiff;

      // Re-enable auto-scroll if user is near bottom
      setTimeout(() => {
        setShouldAutoScroll(isNearBottom());
      }, 100);
    });
  }

  function onCloseChat() {
    navigate("/chats");
  }

  function onMakeCall() {
    navigate(`/chats/${chatId}/call`);
  }

  function scrollToBottom() {
    if (scrollEleRef.current) {
      (scrollEleRef.current as HTMLElement).scrollIntoView({
        behavior: "smooth",
      });
    }
  }

  return (
    <>
      <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr- data-[orientation=vertical]:h-4"
        />
        <div className="w-full flex flex-row justify-between items-start">
          {chatDetails && chatDetails.chatType === "direct" && (
            <div className="flex flex-row space-x-3 items-center">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <h2 className="text-foreground text-base font-medium">
                {chatDetails.receiverUserInfo.userName}
              </h2>
            </div>
          )}
          <div className="flex flex-row space-x-3 items-center">
            {chatDetails && chatDetails.chatType === "direct" && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Video call"
                className="cursor-pointer"
                onClick={onMakeCall}
              >
                <Video />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              className="cursor-pointer"
            >
              <Search />
            </Button>
            <DropdownMenu
              open={openDropdownMenu}
              onOpenChange={setOpenDropdownMenu}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Options"
                  className="cursor-pointer"
                >
                  <EllipsisVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onSelect={() => setOpenAccountInfoDrawer(true)}
                >
                  <Info /> User info
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCloseChat}>
                  <MessageCircleX /> Close chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      {/* begin:: Messages container */}
      <div
        className="flex flex-1 flex-col gap-5 p-4 overflow-y-auto"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {hasNextPage && (
          <div className="w-full flex justify-center mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadOlderMessages}
              disabled={!hasNextPage || isFetchingNextPage}
            >
              {isFetchingNextPage ? "Loading..." : "Load older"}
            </Button>
          </div>
        )}
        {isLoading &&
          Array.from({ length: 24 }).map((_, index) => (
            <div
              key={index}
              className="bg-muted/50 aspect-video h-12 w-full rounded-lg"
            />
          ))}
        {!isLoading &&
          messagesList.length > 0 &&
          messagesList.map((message: Message) => (
            <MessageItem key={message.id} {...message} />
          ))}
      </div>
      {/* end:: Messages container */}

      <div ref={scrollEleRef}></div>

      {/* begin:: new message box */}
      <MessageBox chatId={chatId} />
      {/* end:: new message box */}

      {/* begin:: Account drawer for direct chats */}
      {chatDetails && chatDetails.chatType === "direct" && (
        <AccountInfoDrawer
          open={openAccountInfoDrawer}
          setOpen={setOpenAccountInfoDrawer}
          chatDetails={chatDetails}
        />
      )}
      {/* end:: Account drawer for direct chats */}
    </>
  );
}

export default ChatContainer;
