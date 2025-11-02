import { useQuery } from "@tanstack/react-query";

import { getUserFriends } from "@/services/friendsService";
import { useBoundStore } from "@/stores/useBoundStore";
import { type SuccessResponse, type User } from "@/types";

export const useQueryFriends = () => {
  const isAuthenticated = useBoundStore((state) => state.isAuthenticated);

  return useQuery<SuccessResponse<User[]>>({
    queryKey: ["friends"],
    queryFn: getUserFriends,
    enabled: isAuthenticated,
  });
};
