import { IsBoolean } from 'class-validator';

export class UpdateNotificationDto {
  // Verify that the payload strictly enforces a boolean type to prevent type coercion issues.
  @IsBoolean()
  read!: boolean;
}
