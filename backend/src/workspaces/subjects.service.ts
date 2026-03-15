import { Injectable } from '@nestjs/common';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';

@Injectable()
export class SubjectsService {
  // GET /workspaces/:wsId/subjects — List subjects (API 4.1)
  list(_wsId: string) {
    // TODO: replace with Prisma findMany({ where: { workspaceId: wsId } })
    return [];
  }

  // POST /workspaces/:wsId/subjects — Create subject (API 4.2)
  create(wsId: string, dto: CreateSubjectDto) {
    // TODO: replace with Prisma create — verify caller is workspace member; emit WS 'subject_created'
    return {
      id: `sub_${Date.now()}`,
      workspaceId: wsId,
      ...dto,
    };
  }

  // PATCH /subjects/:subjectId — Update subject (API 4.3)
  update(subjectId: string, dto: UpdateSubjectDto) {
    // TODO: replace with Prisma update — verify workspace membership; emit WS 'subject_updated'
    return {
      id: subjectId,
      ...dto,
    };
  }

  // DELETE /subjects/:subjectId — Remove subject (API 4.4)
  remove(_subjectId: string) {
    // TODO: replace with Prisma delete — verify workspace membership; emit WS 'subject_deleted'
    return;
  }
}
