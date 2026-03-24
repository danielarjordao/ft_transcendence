import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { ChangePasswordDto, Verify2FaDto } from './dto/account-security.dto';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(@Body() dto: ChangePasswordDto) {
    // TODO: Extract actual userId from the JWT request object (e.g., @Req() req)
    this.accountService.changePassword('usr_123', dto);
  }

  @Post('2fa/setup')
  // Added to match API Contract (200 OK instead of 201)
  @HttpCode(HttpStatus.OK)
  setup2fa() {
    // TODO: Extract actual userId from the JWT request object
    return this.accountService.setup2fa('usr_123');
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.NO_CONTENT)
  verify2fa(@Body() dto: Verify2FaDto) {
    // TODO: Extract actual userId from the JWT request object
    this.accountService.verify2fa('usr_123', dto);
  }

  @Delete('2fa')
  @HttpCode(HttpStatus.NO_CONTENT)
  disable2fa(@Body() dto: Verify2FaDto) {
    // TODO: Extract actual userId from the JWT request object
    this.accountService.disable2fa('usr_123', dto);
  }
}
