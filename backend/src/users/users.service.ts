import {
  Injectable,
  NotFoundException,
  ConflictException,
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
    // Upload the file to AWS S3 and get the public URL
    const avatarUrl = await this.s3Service.uploadFile(file, 'avatars');

    // Update the user's avatar URL in the database
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
      },
    });

    return updatedUser;
  }
}
