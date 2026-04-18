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
