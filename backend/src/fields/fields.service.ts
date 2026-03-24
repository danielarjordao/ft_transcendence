import { Injectable } from '@nestjs/common';
import { CreateFieldDto } from './dto/create-field.dto';

@Injectable()
export class FieldsService {
  private fields = [
    { id: 'fld_1', name: 'Status', type: 'select', workspaceId: 'ws_1' },
  ];

  findAll(workspaceId: string) {
    console.log(`Fetching fields for workspace ${workspaceId}`);
    return this.fields;
  }

  create(workspaceId: string, dto: CreateFieldDto) {
    const newField = { id: `fld_${Date.now()}`, ...dto, workspaceId };
    this.fields.push(newField);
    return newField;
  }

  update(workspaceId: string, id: string, updateData: Partial<CreateFieldDto>) {
    const index = this.fields.findIndex(
      (field) => field.id === id && field.workspaceId === workspaceId,
    );

    if (index === -1) return null;

    this.fields[index] = { ...this.fields[index], ...updateData };
    return this.fields[index];
  }

  remove(workspaceId: string, id: string) {
    const initialLength = this.fields.length;
    this.fields = this.fields.filter(
      (field) => !(field.id === id && field.workspaceId === workspaceId),
    );

    return { deleted: this.fields.length < initialLength };
  }
}
