import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { RequestWithUser } from 'src/common/guards/interfaces/active-user.interface';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AccountService } from './account.service';
import { ChangePasswordDto, Verify2FaDto } from './dto/account-security.dto';

// Verify that authentication guards are applied at the class level
// to prevent accidental exposure of future endpoints.
@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  // Check that ID extraction is centralized in a private helper
  // to enforce Fail-Fast patterns and avoid repetitive null-checking.
  private getUserId(request: RequestWithUser): string {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return userId;
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(@Req() req: RequestWithUser, @Body() dto: ChangePasswordDto) {
    return this.accountService.changePassword(this.getUserId(req), dto);
  }

  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  setup2fa(@Req() req: RequestWithUser) {
    return this.accountService.setup2fa(this.getUserId(req));
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.NO_CONTENT)
  verify2fa(@Req() req: RequestWithUser, @Body() dto: Verify2FaDto) {
    return this.accountService.verify2fa(this.getUserId(req), dto);
  }

  @Delete('2fa')
  @HttpCode(HttpStatus.NO_CONTENT)
  disable2fa(@Req() req: RequestWithUser, @Body() dto: Verify2FaDto) {
    return this.accountService.disable2fa(this.getUserId(req), dto);
  }
}
