import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import 'multer';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { Prisma } from '../generated/prisma/client';
import { createPaginatedResponse } from '../common/utils/pagination.util';
import { AppGateway } from '../realtime/app.gateway';
import { S3Service } from '../storage/s3.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly appGateway: AppGateway,
    private readonly s3Service: S3Service,
  ) {}

  // Helper method: Centralized notification logic to inform friends of user status changes, profile updates, etc.
  private async notifyFriends(userId: string, eventName: string, payload: any) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
    });

    const friendIds = friendships.map((f) =>
      f.userAId === userId ? f.userBId : f.userAId,
    );

    // Notify all friends about the event (e.g., 'profile_updated', 'status_changed') with the relevant payload.
    friendIds.forEach((friendId) => {
      this.appGateway.server.to(`user:${friendId}`).emit(eventName, payload);
    });

    // Also notify the user themselves if needed (e.g., for confirmation of their own action).
    this.appGateway.server.to(`user:${userId}`).emit(eventName, payload);
  }

  async getMe(userId: string) {
    // Explicit selection ensures no sensitive authentication data is exposed to the client,
    // strictly adhering to the API.md contract for GET /api/users/me.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        bio: true,
        avatarUrl: true,
        accountType: true,
        preferences: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Fail-Fast: Enforce username uniqueness before attempting the database update.
    if (dto.username) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Username is already taken');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        username: dto.username,
        fullName: dto.fullName,
        bio: dto.bio,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        bio: true,
        avatarUrl: true,
      },
    });

    // Real-Time Update: Notify all friends about the profile update so they can see the changes immediately in their friend lists or chats.
    await this.notifyFriends(userId, 'profile_updated', {
      userId,
      updates: {
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        bio: updatedUser.bio,
      },
    });

    return updatedUser;
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    // Strategy: Perform an in-memory deep merge to prevent overwriting existing JSON preference fields.
    const user = await this.getMe(userId);

    const currentPrefs = (user.preferences as UpdatePreferencesDto) || {};
    const currentNotifs = currentPrefs.notifications || {};

    const mergedPreferences = {
      ...currentPrefs,
      ...(dto.theme !== undefined && { theme: dto.theme }),
      notifications: {
        ...currentNotifs,
        ...(dto.notifications || {}),
      },
    };

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferences: mergedPreferences as unknown as Prisma.InputJsonValue,
      },
    });

    return updatedUser.preferences;
  }

  async getPublicProfile(userId: string) {
    // Public projection: Strictly limit exposed fields for non-authenticated profile viewing.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        username: true,
        bio: true,
        avatarUrl: true,
        isOnline: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Bridge the gap between the database boolean and the frontend string contract.
    const { isOnline, ...rest } = user;
    return {
      ...rest,
      status: isOnline ? 'online' : 'offline',
    };
  }

  async search(query: string, limit: number, offset: number) {
    if (!query) return createPaginatedResponse([], 0, limit, offset);

    const whereClause: Prisma.UserWhereInput = {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { fullName: { contains: query, mode: 'insensitive' } },
      ],
    };

    // Optimization: Use a single transaction to fetch both total count and paginated results, ensuring data consistency and reducing latency.
    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where: whereClause }),
      this.prisma.user.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        select: {
          id: true,
          fullName: true,
          username: true,
          avatarUrl: true,
          isOnline: true,
        },
      }),
    ]);

    const formattedUsers = users.map((user) => {
      const { isOnline, ...rest } = user;
      return { ...rest, status: isOnline ? 'online' : 'offline' };
    });

    // Use the utility function to create a consistent paginated response structure.
    return createPaginatedResponse(formattedUsers, total, limit, offset);
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided');
    }

    // Fetch the current avatar URL before making any changes to ensure we can clean up the old file if the upload and database update succeed.
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    // Upload the new avatar to S3 first to ensure we have the new URL ready before updating the database.
    let newAvatarUrl: string;
    try {
      newAvatarUrl = await this.s3Service.uploadFile(file, 'avatars');
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Upload S3 failed for user ${userId}: ${errMessage}`);
      throw new InternalServerErrorException(
        'Failed to upload the new avatar to storage.',
      );
    }

    // Update the user's avatar URL in the database. If this fails, we will attempt to roll back the S3 upload to prevent orphaned files.
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: newAvatarUrl },
        select: { id: true, username: true, avatarUrl: true },
      });

      // Clean up the old avatar from S3 if it exists to prevent orphaned files and manage storage costs effectively.
      if (currentUser?.avatarUrl) {
        this.s3Service
          .deleteFile(String(currentUser.avatarUrl))
          .catch((deleteError: unknown) => {
            const errMsg =
              deleteError instanceof Error
                ? deleteError.message
                : String(deleteError);
            this.logger.warn(
              `Could not delete old avatar for user ${userId}: ${errMsg}`,
            );
          });
      }

      this.logger.log(`Avatar successfully updated for user ${userId}`);
      return updatedUser;
    } catch (error: unknown) {
      // If the database update fails, we need to roll back the S3 upload to prevent orphaned files and manage storage costs effectively.
      const errMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Database update failed for user ${userId}: ${errMessage}. Rolling back S3 upload.`,
      );

      try {
        await this.s3Service.deleteFile(newAvatarUrl);
      } catch (rollbackError: unknown) {
        const rbMessage =
          rollbackError instanceof Error
            ? rollbackError.message
            : String(rollbackError);
        this.logger.error(
          `CRITICAL: Rollback failed. Orphan file left in S3: ${newAvatarUrl}. Error: ${rbMessage}`,
        );
      }

      throw new InternalServerErrorException(
        'Failed to update user profile with new avatar.',
      );
    }
  }
}
