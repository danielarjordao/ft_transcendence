// Workspace member contract.
// Source of truth: API.md section 3.6 (List Workspace Members)
// Backend: backend/src/workspaces/workspaces.service.ts -> listMembers()

export type WorkspaceRole = 'admin' | 'member';
export type MemberStatus = 'online' | 'offline';

export interface WorkspaceMember {
  userId: string;
  username: string;
  fullName: string;
  role: WorkspaceRole;
  status: MemberStatus;
}