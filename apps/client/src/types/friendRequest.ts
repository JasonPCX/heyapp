import type { User } from "./user";

export interface FriendRequest {
  id: string;
  senderId: string;
  sender: User;
  receiverId: string;
  receiver: User;
  status: "pending" | "accepted" | "rejected";
}
