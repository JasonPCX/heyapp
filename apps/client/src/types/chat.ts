import { type User } from "./index";

/**
 * Chat Types
 */

export interface Chat {
  id: string;
  type: string;
  title?: string;
  description?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatPreview {
  id: string;
  chatType: "direct" | "group";
  title: any;
  description: any;
  createdBy: string;
  lastMessageId: any;
  lastMessageText: any;
  lastMessageAt: any;
  lastMessageAtFormatted: string | null;
  lastMessageUserId: any;
  lastMessageUserName: any;
  lastMessageUserEmail: any;
  friendUserId: string;
  friendUserName: string;
  friendUserEmail: string;
  memberCount: string;
}

export interface DirectChatResponse {
  chatType: "direct";
  chatInfo: Chat;
  receiverUserInfo: ChatMember;
}

export interface GroupChatResponse {
  chatType: "group";
  chatInfo: Chat;
  chatMembers: ChatMember[];
  membersCount: number;
}

export type ChatInfoResponse = DirectChatResponse | GroupChatResponse;

export interface ChatMember {
  userId: string;
  chatId: string;
  role: "owner" | "admin" | "member";
  userName: string;
  userEmail: string;
  isCurrentUser?: boolean;
}

export interface Message {
  id: string;
  userId: string;
  chatId: string;
  text: string;
  messageDirection: "incoming" | "outgoing";
  createdAt?: string;
  createdAtFormatted?: string;
  updatedAt?: string;
  user?: User;
}


export interface ChatMessagesResponse {
  data: Message[];
  pagination: {
    count: number;
    hasMore: boolean;
    offset: number;
  };
}