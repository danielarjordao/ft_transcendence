import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectsService {
  private subjects = [
    { id: 'sub_1', name: 'Mathematics', color: '#FF5733', workspaceId: 'ws_1' },
  ];

  findAll(workspaceId: string) {
    console.log(`Fetching subjects for workspace ${workspaceId}`);
    // TODO: Use Prisma to fetch all subjects matching the workspaceId.
    return this.subjects.filter(
      (subject) => subject.workspaceId === workspaceId,
    );
  }

  create(workspaceId: string, dto: CreateSubjectDto) {
    // TODO: Verify if the user has permission to create subjects in this workspace.
    // TODO: Use Prisma to insert the new subject into the database.
    // TODO: Emit WebSocket event 'subject_created' to 'workspace:{workspaceId}'.

    const newSubject = { id: `sub_${Date.now()}`, ...dto, workspaceId };
    this.subjects.push(newSubject);
    return newSubject;
  }

  update(id: string, updateData: Partial<CreateSubjectDto>) {
    // TODO: Use Prisma to find the subject by ID and update it.
    // TODO: Emit WebSocket event 'subject_updated' to the respective workspace room.

    const index = this.subjects.findIndex((subject) => subject.id === id);

    if (index === -1) {
      throw new NotFoundException('Subject not found');
    }

    // Deep merge the existing subject with the update data
    this.subjects[index] = { ...this.subjects[index], ...updateData };
    return this.subjects[index];
  }

  remove(id: string) {
    // TODO: Use Prisma to delete the subject by ID.
    // TODO: Emit WebSocket event 'subject_deleted' to the respective workspace room.
    // TODO: Handle cascading rules (e.g., what happens to tasks linked to this subject?).

    const index = this.subjects.findIndex((subject) => subject.id === id);

    if (index === -1) {
      throw new NotFoundException('Subject not found');
    }

    this.subjects.splice(index, 1);
  }
}
