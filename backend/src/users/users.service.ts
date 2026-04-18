import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import 'multer';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    // Explicit selection ensures no sensitive authentication data is exposed to the client.
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
        isOnline: true,
        twoFactorEnabled: true,
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

    // TODO: [Feature - WebSockets] Emit 'profile_updated' event to all connected clients to synchronize UI elements instantly.

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

  async search(query: string, limit: number) {
    if (!query) return [];

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { fullName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        fullName: true,
        username: true,
        avatarUrl: true,
        isOnline: true,
      },
    });

    return users.map((user) => {
      const { isOnline, ...rest } = user;
      return {
        ...rest,
        status: isOnline ? 'online' : 'offline',
      };
    });
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    // Fail-Fast: Verify the file actually exists in the payload.
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // TODO: [Feature - Security] Implement strict validation for file type (MIME check) and size constraints using a custom Pipe.
    // TODO: [Feature - S3 Storage] Upload the physical file to AWS S3 and retrieve the real storage key.
    // TODO: [Feature - S3 Storage] Construct the newAvatarUrl using the stable S3 URL or a signed endpoint.

    const fileExtension = file.originalname.split('.').pop() || 'png';
    const newAvatarUrl = `https://cdn.fazelo.com/avatars/${userId}_${Date.now()}.${fileExtension}`;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: newAvatarUrl },
      select: { avatarUrl: true },
    });

    // TODO: [Feature - WebSockets] Emit 'avatar_updated' event so connected friends see the visual change immediately.

    return updatedUser;
  }
}
