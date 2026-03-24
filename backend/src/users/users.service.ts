import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

// Mock data representing the database
const MOCK_USERS = [
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

@Injectable()
export class UsersService {
  // TODO: Replace with Prisma - prisma.user.findUnique
  getMe(userId: string) {
    const user = MOCK_USERS.find((user) => user.id === userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // TODO: Replace with Prisma - prisma.user.update
  updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = this.getMe(userId);
    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.username)
      // In a real implementation, check for username uniqueness before updating
      user.username = dto.username;
    if (dto.bio !== undefined) user.bio = dto.bio;
    return user;
  }

  // TODO: Replace with Prisma - prisma.user.update (JSON field or relation)
  updatePreferences(userId: string, dto: UpdatePreferencesDto) {
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

  // TODO: Replace with Prisma - prisma.user.findUnique (select specific public fields)
  getPublicProfile(userId: string) {
    const user = MOCK_USERS.find((user) => user.id === userId);
    if (!user) throw new NotFoundException('User not found');

    // Return only public fields
    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      status: user.status,
    };
  }

  // TODO: Replace with Prisma - prisma.user.findMany (where name contains search string)
  search(query: string, limit: number) {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();

    const results = MOCK_USERS.filter(
      (user) =>
        user.fullName.toLowerCase().includes(lowerQuery) ||
        user.username.toLowerCase().includes(lowerQuery),
    ).slice(0, limit);

    // Map to lightweight user cards
    return results.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      avatarUrl: user.avatarUrl,
      status: user.status,
    }));
  }
}
