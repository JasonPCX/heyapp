import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
  text,
  primaryKey,
  index,
  unique,
  uniqueIndex,
  boolean,
} from "drizzle-orm/pg-core";

const timestamps = {
  updatedAt: timestamp().defaultNow(),
  createdAt: timestamp().defaultNow().notNull(),
  deletedAt: timestamp(),
};

export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 150 }).notNull(),
  ...timestamps,
});

export const usersRelations = relations(usersTable, ({ many }) => ({
  chats: many(chatsTable),
  chatMembers: many(chatMembersTable),
  messages: many(messagesTable),
  messagesReads: many(messageReadsTable),
  sentRequests: many(friendRequestsTable, { relationName: "sentRequests" }),
  receivedRequests: many(friendRequestsTable, {
    relationName: "receivedRequests",
  }),
  friendsAsUserA: many(friendsTable, { relationName: "userA" }),
  friendsAsUserB: many(friendsTable, { relationName: "userB" }),
}));

export const chatTypeEnum = pgEnum("chat_type", ["direct", "group"]);

export const chatsTable = pgTable("chats", {
  id: uuid().primaryKey().defaultRandom(),
  type: chatTypeEnum().notNull(),
  title: varchar({ length: 100 }),
  description: text(),
  createdBy: uuid().references(() => usersTable.id),
  ...timestamps,
});

export const chatsRelations = relations(chatsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [chatsTable.createdBy],
    references: [usersTable.id],
  }),
  chatMembers: many(chatMembersTable),
  messages: many(messagesTable),
}));

export const chatMemberRoleEnum = pgEnum("chat_member_role", [
  "owner",
  "admin",
  "member",
]);

// Junctional or join table
export const chatMembersTable = pgTable(
  "chat_members",
  {
    userId: uuid()
      .notNull()
      .references(() => usersTable.id),
    chatId: uuid()
      .notNull()
      .references(() => chatsTable.id),
    role: chatMemberRoleEnum().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.chatId] })]
);

export const chatMembersRelations = relations(chatMembersTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [chatMembersTable.userId],
    references: [usersTable.id],
  }),
  chat: one(chatsTable, {
    fields: [chatMembersTable.chatId],
    references: [chatsTable.id],
  }),
}));

export const messagesTable = pgTable("messages", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => usersTable.id),
  chatId: uuid()
    .notNull()
    .references(() => chatsTable.id),
  text: text().notNull(),
  // textSearch: Text search field
  ...timestamps,
});

export const messagesRelations = relations(messagesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [messagesTable.userId],
    references: [usersTable.id],
  }),
  chat: one(chatsTable, {
    fields: [messagesTable.chatId],
    references: [chatsTable.id],
  }),
  messageReads: many(messageReadsTable),
}));

// Junctional or join table
export const messageReadsTable = pgTable(
  "message_reads",
  {
    messageId: uuid()
      .notNull()
      .references(() => messagesTable.id),
    userId: uuid()
      .notNull()
      .references(() => usersTable.id),
  },
  (table) => [primaryKey({ columns: [table.messageId, table.userId] })]
);

export const messageReadsRelations = relations(
  messageReadsTable,
  ({ one }) => ({
    message: one(messagesTable, {
      fields: [messageReadsTable.messageId],
      references: [messagesTable.id],
    }),
    user: one(usersTable, {
      fields: [messageReadsTable.userId],
      references: [usersTable.id],
    }),
  })
);

export const friendRequestStatusEnum = pgEnum("friend_request_status", [
  "pending",
  "accepted",
  "rejected",
]);

export const friendRequestsTable = pgTable("friend_requests", {
  id: uuid().primaryKey().defaultRandom(),
  senderId: uuid()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  receiverId: uuid()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  status: friendRequestStatusEnum().notNull().default("pending"),
  ...timestamps,
});

export const friendRequestsRelations = relations(
  friendRequestsTable,
  ({ one }) => ({
    receiver: one(usersTable, {
      fields: [friendRequestsTable.receiverId],
      references: [usersTable.id],
      relationName: "receiver",
    }),
    sender: one(usersTable, {
      fields: [friendRequestsTable.receiverId],
      references: [usersTable.id],
      relationName: "sender",
    }),
  })
);

export const friendsTable = pgTable(
  "friends",
  {
    userAId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    userBId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    becameFriendsAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userAId, table.userBId] }),
    uniqueIndex("unique_friend_pair_idx").on(table.userAId, table.userBId),
  ]
);

export const friendsRelations = relations(friendsTable, ({ one }) => ({
  userA: one(usersTable, {
    fields: [friendsTable.userAId],
    references: [usersTable.id],
    relationName: "userA",
  }),
  userB: one(usersTable, {
    fields: [friendsTable.userBId],
    references: [usersTable.id],
    relationName: "userB",
  }),
}));
