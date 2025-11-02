import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";

import {
  chatMembersTable,
  chatsTable,
  messagesTable,
  usersTable,
} from "#db/schema.js";
import { db } from "#utils/db.js";
import { CrudService } from "./crud.service.js";
import { ChatMemberService } from "./chat-member.service.js";

export class ChatService extends CrudService {
  static tableSchema = chatsTable;
  static chatTypes = {
    DIRECT: "direct",
    GROUP: "group",
  };

  static async getChatsPreviewByUserId(userId) {
    // 1) Subquery: last message per chat
    const lastMessagePerChat = db
      .selectDistinctOn([messagesTable.chatId], {
        chatId: messagesTable.chatId,
        lastMessageId: messagesTable.id,
        lastMessageText: messagesTable.text,
        lastMessageAt: messagesTable.createdAt,
        lastMessageUserId: messagesTable.userId,
        lastMessageUserName: usersTable.name,
        lastMessageUserEmail: usersTable.email,
      })
      .from(messagesTable)
      .innerJoin(usersTable, eq(usersTable.id, messagesTable.userId))
      .orderBy(messagesTable.chatId, desc(messagesTable.createdAt))
      .as("last_message");

    // 2) Subquery: other member (only for direct chats)
    const otherMemberPerDirectChat = db
      .selectDistinctOn([chatMembersTable.chatId], {
        chatId: chatMembersTable.chatId,
        friendUserId: usersTable.id,
        friendUserName: usersTable.name,
        friendUserEmail: usersTable.email,
      })
      .from(chatMembersTable)
      .innerJoin(chatsTable, eq(chatsTable.id, chatMembersTable.chatId))
      .innerJoin(usersTable, eq(usersTable.id, chatMembersTable.userId))
      .where(
        and(eq(chatsTable.type, "direct"), ne(chatMembersTable.userId, userId))
      )
      .orderBy(chatMembersTable.chatId, usersTable.name)
      .as("other_member");

    // Subquery: member count
    const memberCountPerChat = db
      .select({
        chatId: chatMembersTable.chatId,
        memberCount: sql`COUNT(DISTINCT ${chatMembersTable.userId})`.as(
          "member_count"
        ),
      })
      .from(chatMembersTable)
      .groupBy(chatMembersTable.chatId)
      .as("member_count");

    const chats = await db
      .select({
        id: chatsTable.id,
        type: chatsTable.type,
        title: chatsTable.title,
        description: chatsTable.description,
        createdBy: chatsTable.createdBy,

        // last message
        lastMessageId: lastMessagePerChat.lastMessageId,
        lastMessageText: lastMessagePerChat.lastMessageText,
        lastMessageAt: lastMessagePerChat.lastMessageAt,
        lastMessageUserId: lastMessagePerChat.lastMessageUserId,
        lastMessageUserName: lastMessagePerChat.lastMessageUserName,
        lastMessageUserEmail: lastMessagePerChat.lastMessageUserEmail,

        // friend user
        friendUserId: otherMemberPerDirectChat.friendUserId,
        friendUserName: otherMemberPerDirectChat.friendUserName,
        friendUserEmail: otherMemberPerDirectChat.friendUserEmail,

        // member count
        memberCount: memberCountPerChat.memberCount,
      })
      .from(chatMembersTable)
      .innerJoin(chatsTable, eq(chatMembersTable.chatId, chatsTable.id))
      .leftJoin(
        lastMessagePerChat,
        eq(lastMessagePerChat.chatId, chatsTable.id)
      )
      .leftJoin(
        otherMemberPerDirectChat,
        eq(otherMemberPerDirectChat.chatId, chatsTable.id)
      )
      .leftJoin(
        memberCountPerChat,
        eq(memberCountPerChat.chatId, chatsTable.id)
      )
      .where(eq(chatMembersTable.userId, userId))
      // Order: put chats with a lastMessage first (NULLS LAST), most recent first
      // Sort: first chats that have lastMEssage, then most recent
      .orderBy(
        sql`CASE WHEN ${lastMessagePerChat.lastMessageAt} IS NULL THEN 1 ELSE 0 END`,
        desc(lastMessagePerChat.lastMessageAt)
      )
      .execute();

    return chats;
  }

  static async getUserChatsId(userId) {
    const chats = await db
      .select({
        id: chatsTable.id,
      })
      .from(chatMembersTable)
      .innerJoin(chatsTable, eq(chatMembersTable.chatId, chatsTable.id))
      .where(eq(chatMembersTable.userId, userId))
      .execute();

    return chats;
  }

  static async findDirectChatByMembers(chatMembers) {
    const [userId1, userId2] = chatMembers;
    const targetUserIds = [userId1, userId2];
    const result = await db
      .select({ chatId: this.tableSchema.id })
      .from(this.tableSchema)
      .innerJoin(
        chatMembersTable,
        eq(chatMembersTable.chatId, this.tableSchema.id)
      )
      .where(eq(this.tableSchema.type, this.chatTypes.DIRECT))
      .groupBy(this.tableSchema.id).having(sql`
        COUNT(DISTINCT ${chatMembersTable.userId}) = 2
        AND COUNT(DISTINCT ${chatMembersTable.userId}) FILTER (
          WHERE ${inArray(chatMembersTable.userId, targetUserIds)}
        ) = 2
      `);

    if (result.length == 0) {
      return null;
    }

    const [{ chatId }] = result;
    const [chat] = await db
      .select()
      .from(this.tableSchema)
      .where(eq(this.tableSchema.id, chatId));
    return chat;
  }

  static async createDirectChat(chatMembers, createdByUserId) {
    const [userId1, userId2] = chatMembers;

    const newChat = await db.transaction(async (tx) => {
      const [chat] = await tx
        .insert(this.tableSchema)
        .values({
          type: this.chatTypes.DIRECT,
          createdBy: createdByUserId,
        })
        .returning();

      await tx.insert(chatMembersTable).values([
        {
          chatId: chat.id,
          userId: userId1,
          role: ChatMemberService.chatMemberRoles.Member,
        },
        {
          chatId: chat.id,
          userId: userId2,
          role: ChatMemberService.chatMemberRoles.Member,
        },
      ]);

      return chat;
    });

    return newChat;
  }
}
