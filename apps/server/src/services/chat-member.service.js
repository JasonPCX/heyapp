import { and, eq } from "drizzle-orm";

import { chatMembersTable, usersTable } from "#db/schema.js";
import { db } from "#utils/db.js";
import { CrudService } from "./crud.service.js";

export class ChatMemberService extends CrudService {
  static tableSchema = chatMembersTable;
  static chatMemberRoles = {
    Owner: "owner",
    Admin: "admin",
    Member: "member",
  };

  static async hasMembershipToChat(userId, chatId) {
    const result = await db
      .select()
      .from(this.tableSchema)
      .where(eq(this.tableSchema.userId, userId));

    return result.length > 0;
  }

  static async getChatMembersByChatId(chatId) {
    const result = await db
      .select({
        userId: this.tableSchema.userId,
        chatId: this.tableSchema.chatId,
        role: this.tableSchema.role,
        userName: usersTable.name,
        userEmail: usersTable.email,
      })
      .from(this.tableSchema)
      .innerJoin(usersTable, eq(usersTable.id, this.tableSchema.userId))
      .where(eq(this.tableSchema.chatId, chatId));

    return result;
  }
}
