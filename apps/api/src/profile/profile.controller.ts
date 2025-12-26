import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';

@Controller('profile')
@UseGuards(AuthGuard('jwt'))
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Get current user's profile
   */
  @Get()
  async getMyProfile(@GetUser() user: AuthenticatedUser) {
    return this.profileService.getProfile(user.userId);
  }

  /**
   * Update current user's profile
   */
  @Patch()
  async updateProfile(
    @GetUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user.userId, dto);
  }

  /**
   * Upload profile picture
   */
  @Post('picture')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @GetUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profileService.uploadProfilePicture(user.userId, file);
  }

  /**
   * Remove profile picture
   */
  @Delete('picture')
  async removeProfilePicture(@GetUser() user: AuthenticatedUser) {
    return this.profileService.removeProfilePicture(user.userId);
  }

  /**
   * Get another user's public profile
   */
  @Get(':userId')
  async getPublicProfile(
    @GetUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
  ) {
    return this.profileService.getPublicProfile(userId, user.userId);
  }
}

