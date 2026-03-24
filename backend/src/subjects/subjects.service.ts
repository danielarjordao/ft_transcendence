import { Injectable } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectsService {
  private subjects = [
    { id: 'sub_1', name: 'Mathematics', color: '#FF5733', workspaceId: 'ws_1' },
  ];

  findAll(workspaceId: string) {
    console.log(`Fetching subjects for workspace ${workspaceId}`);
    return this.subjects;
  }

  create(workspaceId: string, dto: CreateSubjectDto) {
    const newSubject = { id: `sub_${Date.now()}`, ...dto, workspaceId };
    this.subjects.push(newSubject);
    return newSubject;
  }

  update(
    workspaceId: string,
    id: string,
    updateData: Partial<CreateSubjectDto>,
  ) {
    const index = this.subjects.findIndex(
      (subject) => subject.id === id && subject.workspaceId === workspaceId,
    );

    // Simulate a not found case
    if (index === -1) return null;

    // Deep merge the existing subject with the update data
    this.subjects[index] = { ...this.subjects[index], ...updateData };
    return this.subjects[index];
  }

  remove(workspaceId: string, id: string) {
    const initialLength = this.subjects.length;
    this.subjects = this.subjects.filter(
      (subject) => !(subject.id === id && subject.workspaceId === workspaceId),
    );

    // Return whether a subject was deleted based on the change in length
    return { deleted: this.subjects.length < initialLength };
  }
}
