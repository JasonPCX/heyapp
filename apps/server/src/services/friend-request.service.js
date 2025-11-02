import { and, eq, inArray, or, isNull, aliasedTable } from "drizzle-orm";

import { friendRequestsTable, usersTable } from "#db/schema.js";
import { db } from "#utils/db.js";
import { CrudService } from "./crud.service.js";

export default class FriendRequestService extends CrudService {
  static tableSchema = friendRequestsTable;
  static friendRequestStatus = {
    PENDING: "pending",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
  };

  static friendRequestTypes = {
    SENT: "sent",
    RECEIVED: "received",
  };

  static async getFriendRequests(
    friendRequestType,
    userId,
    friendRequestStatusArr
  ) {
    let friendRequestTypeFilter = null;

    if (friendRequestType === "sent") {
      friendRequestTypeFilter = eq(this.tableSchema.senderId, userId);
    } else if (friendRequestType === "received") {
      friendRequestTypeFilter = eq(this.tableSchema.receiverId, userId);
    } else {
      throw new Error("A valid friend request type must have to be specified");
    }

    return db
      .select()
      .from(this.tableSchema)
      .where(
        and(
          friendRequestTypeFilter,
          inArray(this.tableSchema.status, friendRequestStatusArr)
        )
      );
  }

  static async checkPendingRequestBetweenUsers(senderId, receiverId) {
    return db
      .select()
      .from(this.tableSchema)
      .where(
        and(
          eq(this.tableSchema.status, this.friendRequestStatus.PENDING),
          and(
            eq(this.tableSchema.senderId, senderId),
            eq(this.tableSchema.receiverId, receiverId)
          )
        )
      );
  }

  static async checkAnyPendingRequestBetweenUsers(userAId, userBId) {
    return db
      .select()
      .from(this.tableSchema)
      .where(
        and(
          eq(this.tableSchema.status, this.friendRequestStatus.PENDING),
          or(
            and(
              eq(this.tableSchema.senderId, userAId),
              eq(this.tableSchema.receiverId, userBId)
            ),
            and(
              eq(this.tableSchema.senderId, userBId),
              eq(this.tableSchema.receiverId, userAId)
            )
          )
        )
      );
  }

  // Override findById to always include sender and receiver data
  static async findById(id) {
    const senderAlias = aliasedTable(usersTable, 'sender');
    const receiverAlias = aliasedTable(usersTable, 'receiver');

    const [result] = await db
      .select({
        id: this.tableSchema.id,
        senderId: this.tableSchema.senderId,
        receiverId: this.tableSchema.receiverId,
        status: this.tableSchema.status,
        createdAt: this.tableSchema.createdAt,
        updatedAt: this.tableSchema.updatedAt,
        deletedAt: this.tableSchema.deletedAt,
        sender: {
          id: senderAlias.id,
          name: senderAlias.name,
          email: senderAlias.email,
        },
        receiver: {
          id: receiverAlias.id,
          name: receiverAlias.name,
          email: receiverAlias.email,
        }
      })
      .from(this.tableSchema)
      .leftJoin(senderAlias, eq(this.tableSchema.senderId, senderAlias.id))
      .leftJoin(receiverAlias, eq(this.tableSchema.receiverId, receiverAlias.id))
      .where(
        and(
          eq(this.tableSchema.id, id),
          isNull(this.tableSchema.deletedAt)
        )
      );
    
    return result;
  }

  // Create and return with relations
  static async createWithRelations(data) {
    const [newFriendRequest] = await this.create(data);
    return await this.findById(newFriendRequest.id);
  }

  // Get friend requests with relations
  static async getFriendRequestsWithRelations(
    friendRequestType,
    userId,
    friendRequestStatusArr
  ) {
    const senderAlias = aliasedTable(usersTable, 'sender');
    const receiverAlias = aliasedTable(usersTable, 'receiver');

    let friendRequestTypeFilter = null;

    if (friendRequestType === "sent") {
      friendRequestTypeFilter = eq(this.tableSchema.senderId, userId);
    } else if (friendRequestType === "received") {
      friendRequestTypeFilter = eq(this.tableSchema.receiverId, userId);
    } else {
      throw new Error("A valid friend request type must have to be specified");
    }

    return db
      .select({
        id: this.tableSchema.id,
        senderId: this.tableSchema.senderId,
        receiverId: this.tableSchema.receiverId,
        status: this.tableSchema.status,
        createdAt: this.tableSchema.createdAt,
        updatedAt: this.tableSchema.updatedAt,
        deletedAt: this.tableSchema.deletedAt,
        sender: {
          id: senderAlias.id,
          name: senderAlias.name,
          email: senderAlias.email,
        },
        receiver: {
          id: receiverAlias.id,
          name: receiverAlias.name,
          email: receiverAlias.email,
        }
      })
      .from(this.tableSchema)
      .leftJoin(senderAlias, eq(this.tableSchema.senderId, senderAlias.id))
      .leftJoin(receiverAlias, eq(this.tableSchema.receiverId, receiverAlias.id))
      .where(
        and(
          friendRequestTypeFilter,
          inArray(this.tableSchema.status, friendRequestStatusArr)
        )
      );
  }
}
