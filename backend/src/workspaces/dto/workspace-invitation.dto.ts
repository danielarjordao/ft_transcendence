import { IsEmail, IsString, IsIn, IsNotEmpty } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['admin', 'member'])
  role!: string;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  inviterId: string;
  inviteeEmail: string;
  role: string;
  status: string;
  createdAt: Date;
}
