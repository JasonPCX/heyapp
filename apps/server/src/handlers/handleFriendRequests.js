import { z } from "zod";

import { UserService } from "#services/user.service.js";
import FriendRequestService from "#services/friend-request.service.js";
import FriendService from "#services/friends.service.js";
import { userRoom } from "#utils/socket.js";

const validateSendFriendRequest = z.object({
  receiverId: z.uuid(),
});

const validateFriendRequestAction = z.object({
  requestId: z.uuid(),
});

export async function handleFriendRequests({ io, socket, redisClient }) {
  socket.on("friend-request:send", async (data, callback) => {
    try {
      const validatedData = validateSendFriendRequest.safeParse(data);

      if (validatedData.error) {
        return callback({
          status: "ERROR",
          message: z.prettifyError(validatedData.error),
        });
      }

      const senderId = socket.user.id;
      const { receiverId } = validatedData.data;

      // Verify that user is not sending a friend request to themselves
      if (senderId === receiverId) {
        return callback({
          status: "ERROR",
          message: "You cannot send a friend request to yourself",
        });
      }

      const existUser = await UserService.findById(receiverId);

      if (!existUser) {
        return callback({
          status: "ERROR",
          message: "Invalid user identifier provided",
        });
      }

      // Check if there's already a pending friend request between these users
      const existingPendingRequest =
        await FriendRequestService.checkAnyPendingRequestBetweenUsers(
          senderId,
          receiverId
        );

      if (existingPendingRequest.length > 0) {
        return callback({
          status: "ERROR",
          message: "A friend request already exists between these users",
        });
      }

      // Check if they are already friends
      const areFriends = await FriendService.checkFriendship(
        senderId,
        receiverId
      );
      if (areFriends.length > 0) {
        return callback({
          status: "ERROR",
          message: "You are already friends",
        });
      }

      // Create the friend request with relations
      const newFriendRequest = await FriendRequestService.createWithRelations({
        senderId,
        receiverId,
        status: FriendRequestService.friendRequestStatus.PENDING,
      });

      socket.to(userRoom(receiverId)).emit("friend-request:new", newFriendRequest);

      return callback({
        status: "SUCCESS",
        message: "Friend request sent successfully",
        data: newFriendRequest,
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
      return callback({
        status: "ERROR",
        message: "Internal server error",
      });
    }
  });

  socket.on("friend-request:accept", async (data, callback) => {
    try {
      const validatedData = validateFriendRequestAction.safeParse(data);

      if (validatedData.error) {
        return callback({
          status: "ERROR",
          message: z.prettifyError(validatedData.error),
        });
      }

      const userId = socket.user.id;
      const { requestId } = validatedData.data;

      // Find the friend request
      const friendRequest = await FriendRequestService.findById(requestId);

      if (!friendRequest) {
        return callback({
          status: "ERROR",
          message: "Friend request not found",
        });
      }

      // Verify that the user is the receiver of the request
      if (friendRequest.receiverId !== userId) {
        return callback({
          status: "ERROR",
          message: "You don't have permission to accept this request",
        });
      }

      // Verify that the request is pending
      if (
        friendRequest.status !==
        FriendRequestService.friendRequestStatus.PENDING
      ) {
        return callback({
          status: "ERROR",
          message: "This request has already been processed",
        });
      }

      // Update status to accepted
      await FriendRequestService.update(requestId, {
        status: FriendRequestService.friendRequestStatus.ACCEPTED,
      });

      // Create the friendship relationship
      await FriendService.create({
        userAId: friendRequest.senderId,
        userBId: friendRequest.receiverId,
      });

      // Get updated friend request with relations after status change
      const updatedFriendRequest = await FriendRequestService.findById(requestId);
      
      socket
        .to(userRoom(friendRequest.senderId))
        .emit("friend-request:accepted", updatedFriendRequest);

      return callback({
        status: "SUCCESS",
        message: "Friend request accepted",
      });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      return callback({
        status: "ERROR",
        message: "Internal server error",
      });
    }
  });

  socket.on("friend-request:reject", async (data, callback) => {
    try {
      const validatedData = validateFriendRequestAction.safeParse(data);

      if (validatedData.error) {
        return callback({
          status: "ERROR",
          message: z.prettifyError(validatedData.error),
        });
      }

      const userId = socket.user.id;
      const { requestId } = validatedData.data;

      // Find the friend request
      const friendRequest = await FriendRequestService.findById(requestId);

      if (!friendRequest) {
        return callback({
          status: "ERROR",
          message: "Friend request not found",
        });
      }

      // Verify that the user is the receiver of the request
      if (friendRequest.receiverId !== userId) {
        return callback({
          status: "ERROR",
          message: "You don't have permission to reject this request",
        });
      }

      // Verify that the request is pending
      if (
        friendRequest.status !==
        FriendRequestService.friendRequestStatus.PENDING
      ) {
        return callback({
          status: "ERROR",
          message: "This request has already been processed",
        });
      }

      // Update status to rejected
      await FriendRequestService.update(requestId, {
        status: FriendRequestService.friendRequestStatus.REJECTED,
      });

      // Get updated friend request with relations after status change
      const updatedFriendRequest = await FriendRequestService.findById(requestId);
      
      socket
        .to(userRoom(friendRequest.senderId))
        .emit("friend-request:rejected", updatedFriendRequest);

      return callback({
        status: "SUCCESS",
        message: "Friend request rejected",
      });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      return callback({
        status: "ERROR",
        message: "Internal server error",
      });
    }
  });

  socket.on("friend-request:delete", async (data, callback) => {
    try {
      const validatedData = validateFriendRequestAction.safeParse(data);

      if (validatedData.error) {
        return callback({
          status: "ERROR",
          message: z.prettifyError(validatedData.error),
        });
      }

      const userId = socket.user.id;
      const { requestId } = validatedData.data;

      // Find the friend request
      const friendRequest = await FriendRequestService.findById(requestId);

      if (!friendRequest) {
        return callback({
          status: "ERROR",
          message: "Friend request not found",
        });
      }

      // Verify that the user is the sender of the request
      if (friendRequest.senderId !== userId) {
        return callback({
          status: "ERROR",
          message: "You don't have permission to delete this request",
        });
      }

      // Only allow deleting pending requests
      if (
        friendRequest.status !==
        FriendRequestService.friendRequestStatus.PENDING
      ) {
        return callback({
          status: "ERROR",
          message: "You can only delete pending requests",
        });
      }

      // Delete the request
      await FriendRequestService.delete(requestId);

      socket
        .to(userRoom(friendRequest.receiverId))
        .emit("friend-request:deleted", requestId);

      return callback({
        status: "SUCCESS",
        message: "Friend request deleted",
      });
    } catch (error) {
      console.error("Error deleting friend request:", error);
      return callback({
        status: "ERROR",
        message: "Internal server error",
      });
    }
  });
}
