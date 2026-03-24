import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFieldDto } from './dto/create-field.dto';

@Injectable()
export class FieldsService {
  // Mock data to simulate database records for fields. In a real implementation, this would be replaced with actual database queries using Prisma.
  private fields = [
    { id: 'fld_1', name: 'To Do', color: '#7A8A99', workspaceId: 'ws_1' },
    { id: 'fld_2', name: 'In Progress', color: '#FFA500', workspaceId: 'ws_1' },
  ];

  findAll(workspaceId: string) {
    console.log(`Fetching fields for workspace ${workspaceId}`);
    // TODO: Use Prisma to fetch all fields where workspaceId matches.
    return this.fields.filter((field) => field.workspaceId === workspaceId);
  }

  create(workspaceId: string, dto: CreateFieldDto) {
    // TODO: Verify if the user has permission to create fields in this workspace.
    // TODO: Use Prisma to insert the new field into the DB.
    // TODO: Emit WebSocket event 'field_created' to 'workspace:{workspaceId}'.

    const newField = { id: `fld_${Date.now()}`, ...dto, workspaceId };
    this.fields.push(newField);
    return newField;
  }

  update(id: string, updateData: Partial<CreateFieldDto>) {
    // TODO: Use Prisma to find the field by ID and update it.
    // TODO: Emit WebSocket event 'field_updated' to the respective workspace room.

    const index = this.fields.findIndex((field) => field.id === id);

    if (index === -1) {
      throw new NotFoundException('Field not found');
    }

    this.fields[index] = { ...this.fields[index], ...updateData };
    return this.fields[index];
  }

  remove(id: string) {
    // TODO: Use Prisma to delete the field by ID.
    // TODO: Emit WebSocket event 'field_deleted' to the respective workspace room.
    // TODO: Handle cascading rules (e.g., what happens to tasks that were in this field?).

    const index = this.fields.findIndex((field) => field.id === id);
    if (index === -1) {
      throw new NotFoundException('Field not found');
    }

    this.fields.splice(index, 1);
  }
}
