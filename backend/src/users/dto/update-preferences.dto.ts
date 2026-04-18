import {
  IsString,
  IsOptional,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

class NotificationsPreferencesDto {
  // Enforce boolean types strictly to prevent type coercion anomalies in the JSON database field.
  @IsBoolean()
  @IsOptional()
  mentions?: boolean;

  @IsBoolean()
  @IsOptional()
  workspaceInvites?: boolean;

  @IsBoolean()
  @IsOptional()
  directMessages?: boolean;
}

export class UpdatePreferencesDto {
  @IsString()
  @IsOptional()
  theme?: string;

  // Verify nested validation ensures the sub-object conforms to NotificationsPreferencesDto structure.
  @ValidateNested()
  @Type(() => NotificationsPreferencesDto)
  @IsOptional()
  notifications?: NotificationsPreferencesDto;
}
