import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { CirclePlus, UserRoundPlus } from "lucide-react";
import { Input } from "../ui/input";
import useDebounce from "@/hooks/use-debounce";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "../ui/skeleton";
import type { User } from "@/types";
import type { SuccessResponse, ErrorResponse } from "@/types/api";
import { getUsers } from "@/services/usersService";
import socket from "@/lib/sockets";
import { toast } from "sonner";

function AddFriendsDialog() {
  const [search, setSearch] = useState<string>("");
  const [open, setOpen] = useState(false);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useQuery<SuccessResponse<User[]>, ErrorResponse>({
    queryKey: ["users-search", debouncedSearch],
    queryFn: () => getUsers({ q: debouncedSearch }),
    enabled: !!debouncedSearch,
  });

  let usersMatchList = data?.data ?? [];

  function onOpenChange(open: boolean) {
    if (!open) {
      setSearch("");
    }
    setOpen((prev) => !prev);
  }

  function closeDialog() {
    setOpen(false);
    setSearch("");
  }

  async function onSendFriendRequest(receiverId: string) {
    const response = await socket.emitWithAck("friend-request:send", {
      receiverId,
    });

    closeDialog();

    if (response && response.status) {
      switch (response.status) {
        case "SUCCESS":
          toast.info(response.message);
          return;
        case "ERROR":
          toast.error(response.message);
          return;
        default:
          toast.error("Failed to send friend requests. Please try again later");
          break;
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Add friends"
          title="Add friends"
        >
          <CirclePlus />
        </Button>
      </DialogTrigger>
      <DialogContent className="min-h-[500px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Find and add new friends</DialogTitle>
          <DialogDescription>
            Enter an email or name to search for matches.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder="Search"
          />

          <div className="flex-1 flex flex-col mt-6">
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

            {usersMatchList.length === 0 &&
              debouncedSearch.trim().length > 0 &&
              !isLoading && (
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-gray-500">No results found.</span>
                </div>
              )}

            {usersMatchList.length === 0 &&
              debouncedSearch.trim().length === 0 &&
              !isLoading && (
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-gray-500">
                    Start typing to find and add new friends.
                  </span>
                </div>
              )}

            {usersMatchList.length > 0 &&
              usersMatchList.map((user) => (
                <div
                  key={user.email}
                  className="w-full flex justify-between items-center space-x-4 mb-4 border-b last:border-b-0 p-4 rounded-lg outline"
                >
                  <div className="flex flex-col items-start justify-start">
                    <span className="text-lg font-medium">{user.name}</span>
                    <span className="line-clamp-1 w-[220px] text-base whitespace-break-spaces text-gray-600">
                      {user.email}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSendFriendRequest(user.id)}
                  >
                    <UserRoundPlus />
                    Send friend request
                  </Button>
                </div>
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddFriendsDialog;
