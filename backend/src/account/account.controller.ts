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
    this.accountService.changePassword('usr_123', dto);
  }

  @Post('2fa/setup')
  setup2fa() {
    return this.accountService.setup2fa('usr_123');
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.NO_CONTENT)
  verify2fa(@Body() dto: Verify2FaDto) {
    this.accountService.verify2fa('usr_123', dto);
  }

  @Delete('2fa')
  @HttpCode(HttpStatus.NO_CONTENT)
  disable2fa(@Body() dto: Verify2FaDto) {
    this.accountService.disable2fa('usr_123', dto);
  }
}
