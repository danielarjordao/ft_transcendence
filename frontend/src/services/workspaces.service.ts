import api from './api';
import type {
  WorkspaceDto,
  WorkspaceMember,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from '../types/workspace';

// Service for workspace-related REST endpoints.
// Sources of truth: API.md sections 3.x (workspaces) and 3.6, 3.11 (members)
// Backend: backend/src/workspaces/workspaces.controller.ts

// Backend returns paginated envelope on GET /workspaces:
//   { items: WorkspaceDto[], pageInfo: { limit, offset, total, hasMore } }
// We unwrap `items` here. Pagination is not surfaced to the UI yet.
// TODO: when workspace count grows, add pagination params (limit/offset).
interface PaginatedWorkspaces {
  items: WorkspaceDto[];
  pageInfo: { limit: number; offset: number; total: number; hasMore: boolean };
}

export const workspacesService = {
  // ── Workspaces CRUD ─────────────────────────────────────────────────────────
  async listWorkspaces(): Promise<WorkspaceDto[]> {
    const res = await api.get<PaginatedWorkspaces>('/workspaces');
    return res.data.items;
  },

  async createWorkspace(input: CreateWorkspaceInput): Promise<WorkspaceDto> {
    const res = await api.post<WorkspaceDto>('/workspaces', input);
    return res.data;
  },

  async updateWorkspace(workspaceId: string, input: UpdateWorkspaceInput): Promise<WorkspaceDto> {
    const res = await api.patch<WorkspaceDto>(`/workspaces/${workspaceId}`, input);
    return res.data;
  },

  async deleteWorkspace(workspaceId: string): Promise<void> {
    await api.delete(`/workspaces/${workspaceId}`);
  },

  // ── Members ─────────────────────────────────────────────────────────────────
  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const res = await api.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
    return res.data;
  },

  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
  },
};