import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import socket from '@/lib/sockets';
import { FriendRequestService } from '@/services/friendRequestService';
import type { FriendRequest } from '@/types';

export function useFriendRequestsDialog() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [newFriendRequest, setNewFriendRequest] = useState<FriendRequest | null>(null);
  const friendRequestService = new FriendRequestService(queryClient);

  useEffect(() => {
    const handleNewFriendRequest = (newFriendRequestData: FriendRequest) => {
      queryClient.invalidateQueries({
        queryKey: ["pending-friend-requests"],
      });
      
      if (newFriendRequest === null) {
        setNewFriendRequest(newFriendRequestData);
        setShowDialog(true);
      } else {
        toast.info(
          `You received a new friend request from ${newFriendRequestData.sender.name}`
        );
      }
    };

    const handleAcceptedFriendRequest = () => {
      queryClient.invalidateQueries({
        queryKey: ["friends"],
      });
      queryClient.invalidateQueries({
        queryKey: ["pending-friend-requests"],
      });
    };

    const handleRejectedFriendRequest = () => {
      queryClient.invalidateQueries({
        queryKey: ["pending-friend-requests"],
      });
    };

    const handleDeletedFriendRequest = (requestId: string) => {
      queryClient.setQueryData(["pending-friend-requests"], (old: any) => {
        if (!old) return old;
        return old.filter((friendRequest: FriendRequest) => friendRequest.id !== requestId);
      });
    };

    socket.on("friend-request:new", handleNewFriendRequest);
    socket.on("friend-request:accepted", handleAcceptedFriendRequest);
    socket.on("friend-request:rejected", handleRejectedFriendRequest);
    socket.on("friend-request:deleted", handleDeletedFriendRequest);

    return () => {
      socket.off("friend-request:new", handleNewFriendRequest);
      socket.off("friend-request:accepted", handleAcceptedFriendRequest);
      socket.off("friend-request:rejected", handleRejectedFriendRequest);
      socket.off("friend-request:deleted", handleDeletedFriendRequest);
    };
  }, [queryClient, newFriendRequest, friendRequestService]);

  const onAcceptFriendRequest = async (requestId: string) => {
    setShowDialog(false);
    await friendRequestService.acceptFriendRequest(requestId);
  };

  const onRejectFriendRequest = async (requestId: string) => {
    setShowDialog(false);
    await friendRequestService.rejectFriendRequest(requestId);
  };

  return {
    showDialog,
    setShowDialog,
    newFriendRequest,
    onAcceptFriendRequest,
    onRejectFriendRequest,
  };
}