import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateWorkspaceInvitationDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['accept', 'decline'], {
    message: `Action must be either accept or decline`,
  })
  action: 'accept' | 'decline';
}
