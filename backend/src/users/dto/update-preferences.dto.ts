import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class NotificationsPreferencesDto {
  @IsOptional()
  mentions?: boolean;

  @IsOptional()
  workspaceInvites?: boolean;

  @IsOptional()
  directMessages?: boolean;
}

export class UpdatePreferencesDto {
  @IsString()
  @IsOptional()
  theme?: string;

  @ValidateNested()
  @Type(() => NotificationsPreferencesDto)
  @IsOptional()
  notifications?: NotificationsPreferencesDto;
}
