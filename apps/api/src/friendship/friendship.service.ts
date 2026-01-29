import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { FriendshipStatusEnum } from '@repo/db';

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  friendshipStatus:
    | 'none'
    | 'pending_sent'
    | 'pending_received'
    | 'friends'
    | 'blocked';
  friendshipId?: number;
}

export interface FriendRequest {
  id: number;
  status: FriendshipStatusEnum;
  createdAt: Date;
  requester: {
    id: string;
    name: string;
    email: string;
    profilePicture: string | null;
  };
  addressee: {
    id: string;
    name: string;
    email: string;
    profilePicture: string | null;
  };
}

export interface Friend {
  id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  friendshipId: number;
  friendsSince: Date;
}

@Injectable()
export class FriendshipService {
  constructor(private readonly dbService: DbService) {}

  /**
   * Search for users by name or email
   */
  async searchUsers(
    currentUserId: string,
    query: string,
    limit = 10,
  ): Promise<UserSearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim();

    // Find users matching the search term (excluding current user)
    const users = await this.dbService.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
      },
      take: limit,
    });

    // Get all friendships for the current user
    const friendships = await this.dbService.friendship.findMany({
      where: {
        OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
      },
    });

    // Map users with their friendship status
    return users.map((user) => {
      const friendship = friendships.find(
        (f) =>
          (f.requesterId === currentUserId && f.addresseeId === user.id) ||
          (f.addresseeId === currentUserId && f.requesterId === user.id),
      );

      let friendshipStatus: UserSearchResult['friendshipStatus'] = 'none';
      let friendshipId: number | undefined;

      if (friendship) {
        friendshipId = friendship.id;
        if (friendship.status === FriendshipStatusEnum.ACCEPTED) {
          friendshipStatus = 'friends';
        } else if (friendship.status === FriendshipStatusEnum.BLOCKED) {
          friendshipStatus = 'blocked';
        } else if (friendship.status === FriendshipStatusEnum.PENDING) {
          friendshipStatus =
            friendship.requesterId === currentUserId
              ? 'pending_sent'
              : 'pending_received';
        }
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        friendshipStatus,
        friendshipId,
      };
    });
  }

  /**
   * Send a friend request
   */
  async sendFriendRequest(
    requesterId: string,
    addresseeId: string,
  ): Promise<FriendRequest> {
    if (requesterId === addresseeId) {
      throw new BadRequestException(
        'You cannot send a friend request to yourself.',
      );
    }

    // Check if addressee exists
    const addressee = await this.dbService.user.findUnique({
      where: { id: addresseeId },
    });

    if (!addressee) {
      throw new NotFoundException('User not found.');
    }

    // Check for existing friendship
    const existingFriendship = await this.dbService.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === FriendshipStatusEnum.ACCEPTED) {
        throw new ConflictException('You are already friends with this user.');
      }
      if (existingFriendship.status === FriendshipStatusEnum.PENDING) {
        throw new ConflictException('A friend request already exists.');
      }
      if (existingFriendship.status === FriendshipStatusEnum.BLOCKED) {
        throw new BadRequestException(
          'Cannot send friend request to this user.',
        );
      }
    }

    // Create friend request
    const friendship = await this.dbService.friendship.create({
      data: {
        requesterId,
        addresseeId,
        status: FriendshipStatusEnum.PENDING,
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
        addressee: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
      },
    });

    return friendship;
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(
    friendshipId: number,
    currentUserId: string,
  ): Promise<FriendRequest> {
    const friendship = await this.dbService.friendship.findUnique({
      where: { id: friendshipId },
      include: {
        requester: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
        addressee: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
      },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found.');
    }

    // Only the addressee can accept the request
    if (friendship.addresseeId !== currentUserId) {
      throw new BadRequestException('You cannot accept this friend request.');
    }

    if (friendship.status !== FriendshipStatusEnum.PENDING) {
      throw new BadRequestException(
        'This friend request is no longer pending.',
      );
    }

    const updatedFriendship = await this.dbService.friendship.update({
      where: { id: friendshipId },
      data: { status: FriendshipStatusEnum.ACCEPTED },
      include: {
        requester: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
        addressee: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
      },
    });

    return updatedFriendship;
  }

  /**
   * Reject a friend request
   */
  async rejectFriendRequest(
    friendshipId: number,
    currentUserId: string,
  ): Promise<void> {
    const friendship = await this.dbService.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found.');
    }

    // Only the addressee can reject the request
    if (friendship.addresseeId !== currentUserId) {
      throw new BadRequestException('You cannot reject this friend request.');
    }

    if (friendship.status !== FriendshipStatusEnum.PENDING) {
      throw new BadRequestException(
        'This friend request is no longer pending.',
      );
    }

    await this.dbService.friendship.delete({
      where: { id: friendshipId },
    });
  }

  /**
   * Cancel a sent friend request
   */
  async cancelFriendRequest(
    friendshipId: number,
    currentUserId: string,
  ): Promise<void> {
    const friendship = await this.dbService.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found.');
    }

    // Only the requester can cancel their own request
    if (friendship.requesterId !== currentUserId) {
      throw new BadRequestException('You cannot cancel this friend request.');
    }

    if (friendship.status !== FriendshipStatusEnum.PENDING) {
      throw new BadRequestException(
        'This friend request is no longer pending.',
      );
    }

    await this.dbService.friendship.delete({
      where: { id: friendshipId },
    });
  }

  /**
   * Remove a friend (unfriend)
   * Also removes all shared content between the two users
   */
  async removeFriend(
    friendshipId: number,
    currentUserId: string,
  ): Promise<void> {
    const friendship = await this.dbService.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found.');
    }

    // Either party can remove the friendship
    if (
      friendship.requesterId !== currentUserId &&
      friendship.addresseeId !== currentUserId
    ) {
      throw new BadRequestException('You are not part of this friendship.');
    }

    if (friendship.status !== FriendshipStatusEnum.ACCEPTED) {
      throw new BadRequestException('You are not friends with this user.');
    }

    // Get the other user's ID
    const otherUserId =
      friendship.requesterId === currentUserId
        ? friendship.addresseeId
        : friendship.requesterId;

    // Use a transaction to delete friendship and all shared content
    await this.dbService.$transaction(async (tx) => {
      // Delete all shared files between the two users (both directions)
      await tx.sharedFile.deleteMany({
        where: {
          OR: [
            { ownerId: currentUserId, recipientId: otherUserId },
            { ownerId: otherUserId, recipientId: currentUserId },
          ],
        },
      });

      // Delete all shared notes between the two users (both directions)
      await tx.sharedNote.deleteMany({
        where: {
          OR: [
            { ownerId: currentUserId, recipientId: otherUserId },
            { ownerId: otherUserId, recipientId: currentUserId },
          ],
        },
      });

      // Delete all shared flashcard decks between the two users (both directions)
      await tx.sharedFlashcardDeck.deleteMany({
        where: {
          OR: [
            { ownerId: currentUserId, recipientId: otherUserId },
            { ownerId: otherUserId, recipientId: currentUserId },
          ],
        },
      });

      // Finally, delete the friendship
      await tx.friendship.delete({
        where: { id: friendshipId },
      });
    });
  }

  /**
   * Get pending friend requests (received)
   */
  async getPendingRequests(currentUserId: string): Promise<FriendRequest[]> {
    return this.dbService.friendship.findMany({
      where: {
        addresseeId: currentUserId,
        status: FriendshipStatusEnum.PENDING,
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
        addressee: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get sent friend requests
   */
  async getSentRequests(currentUserId: string): Promise<FriendRequest[]> {
    return this.dbService.friendship.findMany({
      where: {
        requesterId: currentUserId,
        status: FriendshipStatusEnum.PENDING,
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
        addressee: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all friends
   */
  async getFriends(currentUserId: string): Promise<Friend[]> {
    const friendships = await this.dbService.friendship.findMany({
      where: {
        status: FriendshipStatusEnum.ACCEPTED,
        OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
        addressee: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return friendships.map((f) => {
      const friend =
        f.requesterId === currentUserId ? f.addressee : f.requester;
      return {
        id: friend.id,
        name: friend.name,
        email: friend.email,
        profilePicture: friend.profilePicture,
        friendshipId: f.id,
        friendsSince: f.updatedAt,
      };
    });
  }

  /**
   * Get friendship counts for the current user
   */
  async getFriendshipCounts(currentUserId: string): Promise<{
    friends: number;
    pendingReceived: number;
    pendingSent: number;
  }> {
    const [friends, pendingReceived, pendingSent] = await Promise.all([
      this.dbService.friendship.count({
        where: {
          status: FriendshipStatusEnum.ACCEPTED,
          OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
        },
      }),
      this.dbService.friendship.count({
        where: {
          addresseeId: currentUserId,
          status: FriendshipStatusEnum.PENDING,
        },
      }),
      this.dbService.friendship.count({
        where: {
          requesterId: currentUserId,
          status: FriendshipStatusEnum.PENDING,
        },
      }),
    ]);

    return { friends, pendingReceived, pendingSent };
  }

  /**
   * Check if two users are friends
   */
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friendship = await this.dbService.friendship.findFirst({
      where: {
        status: FriendshipStatusEnum.ACCEPTED,
        OR: [
          { requesterId: userId1, addresseeId: userId2 },
          { requesterId: userId2, addresseeId: userId1 },
        ],
      },
    });

    return !!friendship;
  }
}
