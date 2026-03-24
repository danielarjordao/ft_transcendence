import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Query,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  searchUsers(@Query('search') search: string, @Query('limit') limit?: string) {
    return this.usersService.search(search, limit ? parseInt(limit, 10) : 10);
  }

  @Get('me')
  getMe() {
    // Hardcoded to 'usr_123' since there's no real authentication yet. In a real implementation, extract user ID from auth token.
    return this.usersService.getMe('usr_123');
  }

  @Patch('me')
  updateProfile(@Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile('usr_123', updateProfileDto);
  }

  @Patch('me/preferences')
  updatePreferences(@Body() updatePreferencesDto: UpdatePreferencesDto) {
    return this.usersService.updatePreferences('usr_123', updatePreferencesDto);
  }

  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    // Avoid conflicting with 'me' route
    if (id === 'me') return;
    return this.usersService.getPublicProfile(id);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  // Change any to a proper DTO when implementing file upload handling
  uploadAvatar(@UploadedFile() file: any) {
    // TODO: Replace with Prisma - Store file securely (e.g., AWS S3), update user's avatarUrl in database, and return the new URL
    console.log('Received file:', file);

    // Simulate storing the file and updating the user's avatar URL
    return {
      avatarUrl: `https://cdn.fazelo.com/avatars/usr_123_${Date.now()}.png`,
    };
  }
}
