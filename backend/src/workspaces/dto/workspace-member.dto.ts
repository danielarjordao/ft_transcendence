import { IsString, IsIn, IsNotEmpty } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['admin', 'member'])
  // The ! operator is used here to tell TypeScript that this property will definitely be assigned a value, even though it's not initialized in the constructor.
  // This is necessary because class-validator will populate this property when validating incoming data.
  role!: string;
}
