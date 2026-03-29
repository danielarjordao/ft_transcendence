import { IsString, IsIn, IsNotEmpty } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['admin', 'member'])
  role: string;
}
