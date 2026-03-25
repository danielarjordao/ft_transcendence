import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Query,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Static and Search Routes first
  @Get()
  searchUsers(@Query('search') search: string, @Query('limit') limit?: string) {
    return this.usersService.search(search, limit ? parseInt(limit, 10) : 10);
  }

  // Exact match 'me' routes
  @Get('me')
  getMe() {
    // TODO: Extract actual userId from the JWT request object
    return this.usersService.getMe('usr_123');
  }

  @Patch('me')
  updateProfile(@Body() updateProfileDto: UpdateProfileDto) {
    // TODO: Extract actual userId from the JWT request object
    return this.usersService.updateProfile('usr_123', updateProfileDto);
  }

  @Patch('me/preferences')
  updatePreferences(@Body() updatePreferencesDto: UpdatePreferencesDto) {
    // TODO: Extract actual userId from the JWT request object
    return this.usersService.updatePreferences('usr_123', updatePreferencesDto);
  }

  // File upload routes
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  // TODO: Add validation for file type and size using Multer options
  // uploadAvatar(@UploadedFile() file: Express.Multer.File) {
  // Typed as Multer file instead of any
  // TODO: Extract actual userId from the JWT request object
  //  return this.usersService.uploadAvatar('usr_123', file);
  //}

  // 4. Dynamic/Parameter routes MUST be last
  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
