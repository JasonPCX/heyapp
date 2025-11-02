import { useQuery } from "@tanstack/react-query";

import { getUserPendingFriendRequests } from "@/services/friendRequestsService";
import { useBoundStore } from "@/stores/useBoundStore";

export function useQueryFriendRequests() {
  const isAuthenticated = useBoundStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["pending-friend-requests"],
    queryFn: getUserPendingFriendRequests,
    enabled: isAuthenticated,
  });
}
