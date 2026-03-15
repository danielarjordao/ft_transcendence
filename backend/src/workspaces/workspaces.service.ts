import { Injectable } from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

@Injectable()
export class WorkspacesService {
  create(createWorkspaceDto: CreateWorkspaceDto) {
    // MOCK: Simulating database save
    return {
      id: `ws_${Date.now()}`,
      ...createWorkspaceDto,
      createdAt: new Date().toISOString(),
    };
  }

  findAll() {
    // MOCK: Returning the exact paginated API contract
    return {
      items: [
        {
          id: 'ws_1',
          name: 'Fazelo Core',
          description: 'Main product workspace.',
          subjects: [],
          fields: [],
        },
      ],
      pageInfo: {
        limit: 20,
        offset: 0,
        total: 1,
        hasMore: false,
      },
    };
  }
}
