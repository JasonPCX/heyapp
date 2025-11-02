import dayjs from "dayjs";

import { ChatMemberService } from "#services/chat-member.service.js";
import { ChatService } from "#services/chat.service.js";
import { MessageService } from "#services/message.service.js";
import asyncCatch from "#utils/asyncCatch.js";
import { NotFoundException } from "#utils/HttpError.js";
import { getIO, chatRoom } from "#utils/socket.js";
import { StatusCodes } from "http-status-codes";

export const getMessagesByChatId = asyncCatch(async (req, res, next) => {
  const chatId = req.params.chatId;
  const userData = req.user;

  const query = {
    offset: Number(req.query.offset ?? 0),
    size: Number(req.query.size ?? 8),
  };

  const chat = await ChatService.findById(chatId);

  if (!chat) {
    throw new NotFoundException(
      "Not exist a chat with the given ID",
      req.originalUrl,
      {
        chatId,
      }
    );
  }

  // Making sure user has access to read  given chats messages
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

  const { messages, messagesCount } = await MessageService.getMessagesByChatId(
    chatId,
    query
  );

  const messagesMap = messages.map((message) => ({
    ...message,
    createdAtFormatted: dayjs.tz(message.createdAt).calendar(dayjs()),
    messageDirection: message.userId === userData.id ? "outgoing" : "incoming",
  }));

  const nextOffset = query.offset + 1;
  const hasMoreMessages = messagesCount > nextOffset * query.size;

  return res.status(StatusCodes.OK).json({
    data: messagesMap,
    pagination: {
      offset: nextOffset,
      count: messagesCount,
      hasMore: hasMoreMessages,
    },
  });
});

export const saveMessage = asyncCatch(async (req, res, next) => {
  const data = req.body;
  const userData = req.user;

  // Making sure user is member of the chat and can send messages
  const hasMemberShip = await ChatMemberService.hasMembershipToChat(
    userData.id,
    data.chatId
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

  const newMessage = await MessageService.create({
    ...data,
    userId: userData.id,
  });

  return res.status(StatusCodes.CREATED).json({
    data: newMessage,
  });
});
