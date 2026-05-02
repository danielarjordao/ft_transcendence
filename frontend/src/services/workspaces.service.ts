import api from './api';
import type { WorkspaceMember } from '../types/workspace';

// Service for workspace-related REST endpoints.
// Currently exposes only list members (API.md 3.6).
// Other workspace operations live in their respective places for now.

export const workspacesService = {
  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const res = await api.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
    return res.data;
  },
};