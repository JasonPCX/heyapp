import { ChatMemberService } from "#services/chat-member.service.js";
import { ChatService } from "#services/chat.service.js";
import { UserService } from "#services/user.service.js";
import asyncCatch from "#utils/asyncCatch.js";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "#utils/HttpError.js";
import { getIO } from "#utils/socket.js";
import dayjs from "dayjs";
import { StatusCodes } from "http-status-codes";

export const getUserChats = asyncCatch(async (req, res, next) => {
  const userData = req.user;

  const chats = await ChatService.getChatsPreviewByUserId(userData.id);

  const chatsMap = chats.map((chat) => ({
    ...chat,
    lastMessageAtFormatted:
      chat.lastMessageAt == null || chat.lastMessageAt == undefined
        ? ""
        : dayjs.tz(chat.lastMessageAt).calendar(dayjs()),
  }));

  return res.status(StatusCodes.OK).json({
    data: chatsMap,
  });
});

export const getChat = asyncCatch(async (req, res, next) => {
  const chatId = req.params.id;
  const userData = req.user;

  const chat = await ChatService.findById(chatId);

  if (!chat) {
    throw new NotFoundException(
      "Chat not found with provided ID",
      req.originalUrl,
      {
        chatId,
      }
    );
  }

  const hasMemberShip = await ChatMemberService.hasMembershipToChat(
    userData.id,
    chatId
  );

  if (!hasMemberShip) {
    throw new ForbiddenException(
      "Access denied to chat information",
      req.originalUrl,
      {
        hasMemberShip,
      }
    );
  }

  const chatMembers = await ChatMemberService.getChatMembersByChatId(chat.id);

  if (chat.type === ChatService.chatTypes["DIRECT"]) {
    const receiverUser = chatMembers.find(
      (chatMember) => chatMember.userId !== userData.id
    );
    return res.status(StatusCodes.OK).json({
      chatType: chat.type,
      chatInfo: chat,
      receiverUserInfo: receiverUser,
    });
  }

  if (chat.type === ChatService.chatTypes["GROUP"]) {
    const chatMembersMap = chatMembers.map((chatMember) => ({
      ...chatMembers,
      isCurrentUser: chatMember.userId === userData.id,
    }));

    return res.status(StatusCodes.OK).json({
      chatType: chat.type,
      chatInfo: chat,
      chatMembers: chatMembersMap,
      membersCount: chatMembersMap.length,
    });
  }

  return res.json({ data: chat });
});

export const findOrCreateDirectChatByMembersIds = asyncCatch(
  async (req, res, next) => {
    const userData = req.user;
    const userId = req.body.userId;

    const existUser = await UserService.findById(userId);

    if (!existUser) {
      throw new NotFoundException(
        "User not found with provided ID",
        req.originalUrl,
        {
          userId,
        }
      );
    }

    const chatMembers = [userId, userData.id];

    const existingChat = await ChatService.findDirectChatByMembers(chatMembers);

    if (existingChat) {
      return res.status(StatusCodes.OK).json({
        data: existingChat,
      });
    }

    const newChat = await ChatService.createDirectChat(
      chatMembers,
      userData.id
    );

    if (!newChat) {
      throw new BadRequestException(
        "Failed to find or create a chat",
        req.originalUrl,
        {
          chatMembers,
          userData,
        }
      );
    }

    return res.status(201).json({
      data: newChat,
    });
  }
);
