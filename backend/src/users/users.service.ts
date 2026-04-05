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
    // For example: `SELECT * FROM "User" WHERE id = $1 LIMIT 1`.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // First, we must ensure the new username doesn't belong to someone else.
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
    });

    return updatedUser;
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    // Prisma treats JSON columns as standard JavaScript objects.
    // To update nested JSON structures, we first fetch the current state,
    // merge the new values in memory, and send the complete object back to the database.
    const user = await this.getMe(userId);

    // Asserting the type to deal with Prisma's JSON value type safety
    const currentPrefs = (user.preferences as UpdatePreferencesDto) || {};
    const currentNotifs = currentPrefs.notifications || {};

    const mergedPreferences = {
      ...currentPrefs,
      theme: dto.theme || currentPrefs.theme,
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

    return users;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    // TODO: Save file to 'avatars/' folder or Cloud Storage (AWS S3 / Google Cloud).

    console.log(
      `[Storage Mock] Uploading avatar for user ${userId}, file: ${file.originalname}`,
    );

    const newAvatarUrl = `https://cdn.fazelo.com/avatars/${userId}_${Date.now()}.png`;

    // The generated URL is stored in the database, but the actual file handling is mocked for now.
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: newAvatarUrl },
    });

    return {
      avatarUrl: newAvatarUrl,
    };
  }
}
