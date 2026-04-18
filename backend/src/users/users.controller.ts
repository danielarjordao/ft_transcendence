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
import type { RequestWithUser } from 'src/common/guards/interfaces/active-user.interface';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@UseGuards(JwtAuthGuard)
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

  // 1. Static and Search Routes
  @Get()
  searchUsers(
    @Req() req: RequestWithUser,
    @Query('search') search: string,
    @Query('limit') limit?: string,
  ) {
    this.getUserId(req);
    return this.usersService.search(search, limit ? parseInt(limit, 10) : 10);
  }

  // 2. Exact match 'me' routes
  @Get('me')
  getMe(@Req() req: RequestWithUser) {
    return this.usersService.getMe(this.getUserId(req));
  }

  @Patch('me')
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
  updatePreferences(
    @Req() req: RequestWithUser,
    @Body() updatePreferencesDto: UpdatePreferencesDto,
  ) {
    return this.usersService.updatePreferences(
      this.getUserId(req),
      updatePreferencesDto,
    );
  }

  // 3. File upload routes
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(this.getUserId(req), file);
  }

  // 4. Dynamic/Parameter routes MUST be last
  @Get(':id')
  getPublicProfile(@Req() req: RequestWithUser, @Param('id') id: string) {
    this.getUserId(req);
    return this.usersService.getPublicProfile(id);
  }
}
