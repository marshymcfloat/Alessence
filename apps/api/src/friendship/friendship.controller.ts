import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FriendshipService } from './friendship.service';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';

@Controller('friendship')
@UseGuards(AuthGuard('jwt'))
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  /**
   * Search for users by name or email
   */
  @Get('search')
  searchUsers(
    @Query('q') query: string,
    @Query('limit') limit: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.friendshipService.searchUsers(
      user.userId,
      query,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  /**
   * Send a friend request
   */
  @Post('request/:addresseeId')
  sendFriendRequest(
    @Param('addresseeId') addresseeId: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.friendshipService.sendFriendRequest(user.userId, addresseeId);
  }

  /**
   * Accept a friend request
   */
  @Post('accept/:friendshipId')
  acceptFriendRequest(
    @Param('friendshipId', ParseIntPipe) friendshipId: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.friendshipService.acceptFriendRequest(friendshipId, user.userId);
  }

  /**
   * Reject a friend request
   */
  @Delete('reject/:friendshipId')
  rejectFriendRequest(
    @Param('friendshipId', ParseIntPipe) friendshipId: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.friendshipService.rejectFriendRequest(friendshipId, user.userId);
  }

  /**
   * Cancel a sent friend request
   */
  @Delete('cancel/:friendshipId')
  cancelFriendRequest(
    @Param('friendshipId', ParseIntPipe) friendshipId: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.friendshipService.cancelFriendRequest(friendshipId, user.userId);
  }

  /**
   * Remove a friend (unfriend)
   */
  @Delete('remove/:friendshipId')
  removeFriend(
    @Param('friendshipId', ParseIntPipe) friendshipId: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.friendshipService.removeFriend(friendshipId, user.userId);
  }

  /**
   * Get pending friend requests (received)
   */
  @Get('requests/pending')
  getPendingRequests(@GetUser() user: AuthenticatedUser) {
    return this.friendshipService.getPendingRequests(user.userId);
  }

  /**
   * Get sent friend requests
   */
  @Get('requests/sent')
  getSentRequests(@GetUser() user: AuthenticatedUser) {
    return this.friendshipService.getSentRequests(user.userId);
  }

  /**
   * Get all friends
   */
  @Get('friends')
  getFriends(@GetUser() user: AuthenticatedUser) {
    return this.friendshipService.getFriends(user.userId);
  }

  /**
   * Get friendship counts
   */
  @Get('counts')
  getFriendshipCounts(@GetUser() user: AuthenticatedUser) {
    return this.friendshipService.getFriendshipCounts(user.userId);
  }
}

