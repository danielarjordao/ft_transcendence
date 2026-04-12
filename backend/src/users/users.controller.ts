import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Query,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import type { RequestWithUser } from 'src/common/decorators/interfaces/active-user.interface';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private getUserId(request: RequestWithUser): string {
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    return userId;
  }

  // Static and Search Routes first
  @Get()
  searchUsers(@Query('search') search: string, @Query('limit') limit?: string) {
    return this.usersService.search(search, limit ? parseInt(limit, 10) : 10);
  }

  // Exact match 'me' routes
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: RequestWithUser) {
    return this.usersService.getMe(this.getUserId(req));
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Req() req: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(
      this.getUserId(req),
      updateProfileDto,
    );
  }

  @Patch('me/preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @Req() req: RequestWithUser,
    @Body() updatePreferencesDto: UpdatePreferencesDto,
  ) {
    return this.usersService.updatePreferences(
      this.getUserId(req),
      updatePreferencesDto,
    );
  }

  // File upload routes
  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // TODO: Add strict validation for file type (JPG/PNG) and size (5MB) using a Pipe.
    return this.usersService.uploadAvatar(this.getUserId(req), file);
  }

  // 4. Dynamic/Parameter routes MUST be last
  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
