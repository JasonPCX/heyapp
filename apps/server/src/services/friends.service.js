import { and, eq, or } from "drizzle-orm";

import { friendsTable } from "#db/schema.js";
import { db } from "#utils/db.js";
import { CrudService } from "./crud.service.js";

export default class FriendService extends CrudService {
  static tableSchema = friendsTable;

  static async checkFriendship(userAId, userBId) {
    return db
      .select()
      .from(this.tableSchema)
      .where(
        or(
          and(
            eq(this.tableSchema.userAId, userAId),
            eq(this.tableSchema.userBId, userBId)
          ),
          and(
            eq(this.tableSchema.userAId, userBId),
            eq(this.tableSchema.userBId, userAId)
          )
        )
      );
  }
}
