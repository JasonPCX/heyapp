import { and, eq, ilike, isNull, notInArray, or } from "drizzle-orm";

import { db } from "#utils/db.js";
import { usersTable, friendsTable } from "#db/schema.js";
import { CrudService } from "#services/crud.service.js";
import { generateHash } from "#utils/generateHash.js";

export class UserService extends CrudService {
  static tableSchema = usersTable;

  static async register(data) {
    const hash = await generateHash(data.password);
    const newUserData = {
      ...data,
      password: hash,
    };

    const result = await db
      .insert(this.tableSchema)
      .values(newUserData)
      .returning();
    return result;
  }

  static async getUserByEmail(email) {
    const [user] = await db
      .select()
      .from(this.tableSchema)
      .where(
        and(
          eq(this.tableSchema.email, email),
          isNull(this.tableSchema.deletedAt)
        )
      );
    return user;
  }

  static async findById(id) {
    const [user] = await db
      .select({
        id: this.tableSchema.id,
        name: this.tableSchema.name,
        email: this.tableSchema.email,
        createdAt: this.tableSchema.createdAt,
      })
      .from(this.tableSchema)
      .where(
        and(eq(this.tableSchema.id, id), isNull(this.tableSchema.deletedAt))
      );
    return user;
  }

  static async searchUsers({ emailOrNameStr = "" }, excludeUserIds) {
    const filters = [];

    if (emailOrNameStr && emailOrNameStr.trim() !== "") {
      filters.push(ilike(this.tableSchema.name, `%${emailOrNameStr}%`));
      filters.push(ilike(this.tableSchema.email, `%${emailOrNameStr}%`));
    }

    const users = await db
      .select({
        id: this.tableSchema.id,
        name: this.tableSchema.name,
        email: this.tableSchema.email,
        createdAt: this.tableSchema.createdAt,
      })
      .from(this.tableSchema)
      .where(
        and(
          notInArray(this.tableSchema.id, excludeUserIds),
          filters.length > 0 ? or(...filters) : undefined
        )
      )
      .limit(20);

    return users;
  }

  static async getFriends(userId) {
    // Query to get friends where user is either userA or userB
    const friends = await db
      .select({
        id: this.tableSchema.id,
        name: this.tableSchema.name,
        email: this.tableSchema.email,
        createdAt: this.tableSchema.createdAt,
        becameFriendsAt: friendsTable.becameFriendsAt,
      })
      .from(friendsTable)
      .innerJoin(
        this.tableSchema,
        or(
          and(
            eq(friendsTable.userAId, userId),
            eq(friendsTable.userBId, this.tableSchema.id)
          ),
          and(
            eq(friendsTable.userBId, userId),
            eq(friendsTable.userAId, this.tableSchema.id)
          )
        )
      )
      .where(isNull(this.tableSchema.deletedAt));

    return friends;
  }
}
