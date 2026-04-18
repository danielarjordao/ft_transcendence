import { IsString, IsHexColor } from 'class-validator';

export class CreateFieldDto {
  @IsString()
  name!: string;

  // Verify that the color strictly follows Hex format.
  // This prevents UI rendering errors on the frontend Kanban board.
  @IsHexColor()
  color!: string;
}
