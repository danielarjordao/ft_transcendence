import { IsNotEmpty, IsString } from 'class-validator';

export class WorkspaceInvitationTokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
