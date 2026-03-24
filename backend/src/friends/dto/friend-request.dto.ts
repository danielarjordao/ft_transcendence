import { IsString, IsEnum } from 'class-validator';

export class CreateFriendRequestDto {
  @IsString()
  targetUserId: string;
}

export class RespondFriendRequestDto {
  @IsEnum(['accept', 'reject'])
  action: 'accept' | 'reject';
}
