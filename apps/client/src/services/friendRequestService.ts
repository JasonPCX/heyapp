import { toast } from 'sonner';
import { QueryClient } from '@tanstack/react-query';
import socket from '@/lib/sockets';

export class FriendRequestService {
  private queryClient: QueryClient;
  
  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  async acceptFriendRequest(requestId: string): Promise<boolean> {
    const response = await socket.emitWithAck("friend-request:accept", {
      requestId,
    });

    if (response?.status) {
      switch (response.status) {
        case "SUCCESS":
          toast.info(response.message);
          this.invalidateQueries();
          return true;
        case "ERROR":
          toast.error(response.message);
          return false;
        default:
          toast.error("Failed to accept friend request. Please try again later");
          return false;
      }
    }
    return false;
  }

  async rejectFriendRequest(requestId: string): Promise<boolean> {
    const response = await socket.emitWithAck("friend-request:reject", {
      requestId,
    });

    if (response?.status) {
      switch (response.status) {
        case "SUCCESS":
          toast.info(response.message);
          this.queryClient.invalidateQueries({
            queryKey: ["pending-friend-requests"],
          });
          return true;
        case "ERROR":
          toast.error(response.message);
          return false;
        default:
          toast.error("Failed to decline friend request. Please try again later");
          return false;
      }
    }
    return false;
  }

  private invalidateQueries() {
    this.queryClient.invalidateQueries({
      queryKey: ["friends"],
    });
    this.queryClient.invalidateQueries({
      queryKey: ["pending-friend-requests"],
    });
  }
}