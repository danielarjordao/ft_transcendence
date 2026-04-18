import { IsString, IsIn, IsNotEmpty } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['admin', 'member'])
  // The definite assignment assertion (!) guarantees class-validator handles initialization.
  role!: string;
}
