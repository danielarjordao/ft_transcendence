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

@Injectable()
export class UsersService {
  // Injecting PrismaService to interact with the database
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    // `findUnique` translates to a SQL query that looks for a single record based on unique criteria.
    // The `select` object specifies which fields to retrieve from the database.
    // This is crucial for security, as it prevents sensitive information (like password hashes) from being accidentally exposed.
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

    // If no user is found with the given ID, a NotFoundException is thrown, which results in a 404 HTTP response.
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // If username is provided, validate it is not already taken by another user.
    if (dto.username) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });

      // If a user exists with this username, and their ID is different from the current user:
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Username is already taken');
      }
    }

    // `update` modifies an existing record.
    // if a field in `data` is undefined, Prisma simply
    // ignores it and doesn't update that specific column in the database.
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        username: dto.username,
        fullName: dto.fullName,
        bio: dto.bio,
      },
      // 'select' is used here to specify which fields to return after the update operation.
      select: {
        id: true,
        username: true,
        fullName: true,
        bio: true,
        avatarUrl: true,
      },
    });

    return updatedUser;
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    // Retrieve current preferences to merge new changes while preserving existing data.
    // JSON is read from DB, merged in memory, then re-saved atomically.
    const user = await this.getMe(userId);

    // Parse current preferences, handling null or undefined cases.
    const currentPrefs = (user.preferences as UpdatePreferencesDto) || {};
    const currentNotifs = currentPrefs.notifications || {};

    // Merge strategy: only update fields explicitly provided in DTO, preserving other values.
    // Using explicit undefined checks instead of || to avoid losing falsy values like false or 0.
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
        // Ensuring the object is properly serialized for Prisma
        preferences: mergedPreferences as unknown as Prisma.InputJsonValue,
      },
    });

    return updatedUser.preferences;
  }

  async getPublicProfile(userId: string) {
    // The `select` object acts like a SQL projection.
    // Instead of fetching all columns (including sensitive ones like passwordHash),
    // it only fetches the exact columns defined as `true`. This saves RAM and bandwidth.
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

    if (!user) throw new NotFoundException('User not found');

    // Restructuring the response to convert `isOnline` boolean into a more frontend-friendly `status` string.
    const { isOnline, ...rest } = user;
    return {
      ...rest,
      status: isOnline ? 'online' : 'offline',
    };
  }

  async search(query: string, limit: number) {
    if (!query) return [];

    // `findMany` retrieves an array of records.
    // The `OR` operator checks multiple conditions.
    // `contains` acts like a SQL `LIKE '%query%'`.
    // `mode: 'insensitive'` ensures 'Ana' matches 'ana' (acts like `ILIKE` in PostgreSQL).
    // `take` is the equivalent of SQL `LIMIT`.
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
    // Validate file presence and format before storage.
    if (!file) {
      throw new NotFoundException('No file provided');
    }

    // TODO: Implement strict validation for file type (JPG/PNG only) and size (5MB max) using a custom Pipe.
    // TODO: Save file to 'avatars/' folder or Cloud Storage (AWS S3 / Google Cloud) and retrieve stable storage key.
    // TODO: Use storage key to generate temporary/signed URLs instead of hardcoded URLs.

    // For now, construct URL from storage metadata (to be replaced with real storage integration).
    const fileExtension = file.originalname.split('.').pop() || 'png';
    const newAvatarUrl = `https://cdn.fazelo.com/avatars/${userId}_${Date.now()}.${fileExtension}`;

    // Persist the avatar URL in the database.
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: newAvatarUrl },
      select: { avatarUrl: true },
    });

    return updatedUser;
  }
}
