import { messagesTable, usersTable } from "#db/schema.js";
import { db } from "#utils/db.js";
import { asc, desc, eq } from "drizzle-orm";
import { CrudService } from "./crud.service.js";

export class MessageService extends CrudService {
  static tableSchema = messagesTable;

  static async create(data) {
    const [newMessage] = await db
      .insert(this.tableSchema)
      .values(data)
      .returning({ id: this.tableSchema.id });

    const [newMessageData] = await db
      .select({
        ...this.tableSchema,
        user: {
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
          createdAt: usersTable.createdAt,
        },
      })
      .from(this.tableSchema)
      .innerJoin(usersTable, eq(usersTable.id, this.tableSchema.userId))
      .where(eq(this.tableSchema.id, newMessage.id));

    return newMessageData;
  }

  static async getMessagesByChatId(chatId, query) {
    const messagesCount = await db.$count(
      this.tableSchema,
      eq(this.tableSchema.chatId, chatId)
    );

    const startIndex = query.offset * query.size;

    const messages = await db
      .select({
        ...this.tableSchema,
        user: {
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
          createdAt: usersTable.createdAt,
        },
      })
      .from(this.tableSchema)
      .innerJoin(usersTable, eq(usersTable.id, this.tableSchema.userId))
      .where(eq(this.tableSchema.chatId, chatId))
      .orderBy(desc(this.tableSchema.createdAt))
      .limit(query.size)
      .offset(startIndex);

    const reversedMessages = messages.reverse();

    return {
      messages: reversedMessages,
      messagesCount,
    };
  }
}
