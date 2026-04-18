import { IsString, IsHexColor } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  name!: string;

  // Enforcing strict Hex validation at the boundary ensures consistent rendering on the frontend UI.
  @IsHexColor()
  color!: string;
}
