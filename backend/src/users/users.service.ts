import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class UsersService {
  // Encapsulated mock data inside the service
  private mockUsers = [
    {
      id: 'usr_123',
      email: 'ana.laura@42.fr',
      fullName: 'Ana Laura',
      username: 'ana_laura',
      bio: 'Frontend lead @ ft_transcendence.',
      avatarUrl: 'https://github.com/ana.png',
      createdAt: '2024-01-15T10:30:00Z',
      accountType: 'standard',
      status: 'online',
      preferences: {
        theme: 'dark',
        notifications: {
          mentions: true,
          workspaceInvites: true,
          directMessages: true,
        },
      },
    },
    {
      id: 'usr_456',
      email: 'lucas.silva@42.fr',
      fullName: 'Lucas Silva',
      username: 'lucas_dev',
      bio: 'Frontend engineer.',
      avatarUrl: 'https://github.com/lucas.png',
      createdAt: '2024-02-10T09:00:00Z',
      accountType: 'standard',
      status: 'online',
      preferences: {
        theme: 'light',
        notifications: {
          mentions: true,
          workspaceInvites: false,
          directMessages: true,
        },
      },
    },
  ];

  getMe(userId: string) {
    // TODO: Replace with Prisma - prisma.user.findUnique
    const user = this.mockUsers.find((user) => user.id === userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    // TODO: Replace with Prisma - verify if new username is unique (Throw 409 if not), then prisma.user.update
    const user = this.getMe(userId);

    if (dto.username && dto.username !== user.username) {
      const isTaken = this.mockUsers.some((u) => u.username === dto.username);
      if (isTaken) throw new ConflictException('Username is already taken');
      user.username = dto.username;
    }

    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.bio !== undefined) user.bio = dto.bio;

    return user;
  }

  updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    // TODO: Replace with Prisma - prisma.user.update (update JSON preferences object)
    const user = this.getMe(userId);
    if (dto.theme) user.preferences.theme = dto.theme;

    if (dto.notifications) {
      user.preferences.notifications = {
        ...user.preferences.notifications,
        ...dto.notifications,
      };
    }
    return user.preferences;
  }

  getPublicProfile(userId: string) {
    // TODO: Replace with Prisma - prisma.user.findUnique (select specific public fields only)
    const user = this.mockUsers.find((user) => user.id === userId);
    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      status: user.status,
    };
  }

  search(query: string, limit: number) {
    // TODO: Replace with Prisma - prisma.user.findMany (where username or fullName contains query string, case insensitive)
    if (!query) return [];
    const lowerQuery = query.toLowerCase();

    const results = this.mockUsers
      .filter(
        (user) =>
          user.fullName.toLowerCase().includes(lowerQuery) ||
          user.username.toLowerCase().includes(lowerQuery),
      )
      .slice(0, limit);

    return results.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      avatarUrl: user.avatarUrl,
      status: user.status,
    }));
  }

  uploadAvatar(userId: string, file: Express.Multer.File) {
    // TODO: Save file to 'avatars/' folder or Cloud Storage.
    // TODO: Update the user's 'avatarUrl' in the database using Prisma.
    console.log(
      `Uploading avatar for user ${userId}, file: ${file.originalname}`,
    );
    return {
      avatarUrl: `https://cdn.fazelo.com/avatars/${userId}_${Date.now()}.png`,
    };
  }
}
