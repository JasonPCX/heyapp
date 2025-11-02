import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
} from "@/components/ui/sidebar";

import AddContactDialog from "./friends/add-friends-dialog";

import { useNavigate } from "react-router";
import { Skeleton } from "./ui/skeleton";
import { useCreateChatMutation } from "@/hooks/use-chats";
import { useQueryFriends } from "@/hooks/use-friends";
import { Check, UserPlus, Users, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { useQueryFriendRequests } from "@/hooks/use-friend-requests";
import { Button } from "./ui/button";
import socket from "@/lib/sockets";
import { useQueryClient } from "@tanstack/react-query";

function FriendsSidebar() {
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createDirectChatMutation = useCreateChatMutation();

  const { data, isLoading, error, isError } = useQueryFriends();

  const { data: friendRequestsData } = useQueryFriendRequests();

  const friendsList = data?.data ?? [];

  const friendRequests = friendRequestsData?.data ?? [];

  // Handling fetching friends error
  useEffect(() => {
    if (isError) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message);
        return;
      }
    }
  }, [isError, error]);

  function onFriendClick(userId: string) {
    createDirectChatMutation.mutate(userId, {
      onSuccess(data, _variables, _onMutateResult, _context) {
        const chatId = data.data.id;
        navigate(`/chats/${chatId}`);
      },
    });
  }

  async function onAcceptFriendRequest(requestId: string) {
    const response = await socket.emitWithAck("friend-request:accept", {
      requestId,
    });

    if (response && response.status) {
      switch (response.status) {
        case "SUCCESS":
          queryClient.invalidateQueries({
            queryKey: ["friends"],
          });
          queryClient.invalidateQueries({
            queryKey: ["pending-friend-requests"],
          });
          toast.info(response.message);
          return;
        case "ERROR":
          toast.error(response.message);
          return;
        default:
          toast.error(
            "Failed to accept friend requests. Please try again later"
          );
          break;
      }
    }
  }

  async function onRejectFriendRequest(requestId: string) {
    const response = await socket.emitWithAck("friend-request:reject", {
      requestId,
    });

    if (response && response.status) {
      switch (response.status) {
        case "SUCCESS":
          queryClient.invalidateQueries({
            queryKey: ["pending-friend-requests"],
          });
          toast.info(response.message);
          return;
        case "ERROR":
          toast.error(response.message);
          return;
        default:
          toast.error(
            "Failed to decline friend requests. Please try again later"
          );
          break;
      }
    }
  }

  return (
    <>
      <SidebarHeader className="gap-3.5 border-b p-4">
        <div className="flex w-full items-center justify-between">
          <div className="text-foreground text-base font-medium">
            {activeTab === "friends" ? "Friends" : "Friend Requests"}
          </div>
          <AddContactDialog />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("friends")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "friends"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <Users className="h-4 w-4" />
            Friends
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
              activeTab === "requests"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Requests
            {friendRequests.length > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-5 min-w-5 px-1 text-xs"
              >
                {friendRequests.length}
              </Badge>
            )}
          </button>
        </div>
        <SidebarInput placeholder="Type to search..." />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-0">
          <SidebarGroupContent>
            {isLoading && (
              <>
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-4 mb-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </>
            )}
            {!isLoading && activeTab === "friends" && (
              <>
                {friendsList.length === 0 && (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <span className="text-muted-foreground text-center text-sm">
                      You don't have any friends yet. Press add button and
                      search for your friends.
                    </span>
                  </div>
                )}
                {friendsList.map((friend) => (
                  <button
                    key={friend.email}
                    className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:cursor-pointer flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0 w-full"
                    onClick={() => onFriendClick(friend.id)}
                  >
                    <div className="flex w-full items-center gap-2">
                      <span className="text-lg">{friend.name}</span>
                    </div>
                    <span className="line-clamp-1 text-base whitespace-break-spaces">
                      {friend.email}
                    </span>
                  </button>
                ))}
              </>
            )}

            {!isLoading && activeTab === "requests" && (
              <>
                {friendRequests.length === 0 && (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <span className="text-muted-foreground text-center text-sm">
                      No pending friend requests.
                    </span>
                  </div>
                )}
                {friendRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-3 border-b p-4 last:border-b-0"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-base font-medium">
                        {request.sender.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {request.sender.email}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => onAcceptFriendRequest(request.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => onRejectFriendRequest(request.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}

export default FriendsSidebar;
