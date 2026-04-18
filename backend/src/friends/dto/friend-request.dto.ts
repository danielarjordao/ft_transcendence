import { IsString, IsEnum } from 'class-validator';

export class CreateFriendRequestDto {
  @IsString()
  targetUserId!: string;
}

export class RespondFriendRequestDto {
  // Enforcing strict enumeration prevents invalid state mutations at the boundary layer.
  @IsEnum(['accept', 'reject'])
  action!: 'accept' | 'reject';
}
