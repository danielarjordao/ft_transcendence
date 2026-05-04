import api from './api';
import type { WorkspaceMember } from '../types/workspace';

// Service for workspace-related REST endpoints.
// Sources of truth: API.md sections 3.6 and 3.11
// Backend: backend/src/workspaces/workspaces.controller.ts

export const workspacesService = {
  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const res = await api.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
    return res.data;
  },

  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
  },
};
