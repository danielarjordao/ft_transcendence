// Workspace contracts.
// Sources of truth:
//   API.md sections 3.x (workspaces) and 3.6 (members)
//   Backend: backend/src/workspaces/workspaces.controller.ts
// Roles map from backend enum WorkspaceMemberRole (OWNER, ADMIN, MEMBER) lowercased.
//
// Verified by curl on 04/05/2026:
//   GET  /api/workspaces       -> { items: [...], pageInfo }
//   POST /api/workspaces       -> WorkspaceDto (no envelope)
//   Shapes diverge slightly:
//     GET  returns: id, name, description, createdById, createdAt, updatedAt
//     POST returns: id, name, description, subjects, fields, memberCount, memberSummary, createdAt
//   Neither includes userRole yet. Frontend derives it from createdById === currentUserId.

export type WorkspaceRole = 'owner' | 'admin' | 'member';
export type MemberStatus = 'online' | 'offline';

// ── Members ───────────────────────────────────────────────────────────────────
export interface WorkspaceMember {
  userId: string;
  username: string;
  fullName: string;
  role: WorkspaceRole;
  status: MemberStatus;
}

// ── Member summary (returned by POST /workspaces) ─────────────────────────────
export interface MemberSummary {
  id: string;
  username: string;
  avatarUrl: string | null;
}

// ── Workspace (raw backend response, fields optional where backend diverges) ──
// Frontend defensively reads what is present and derives the rest.
export interface WorkspaceDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;       // ISO datetime, present in both GET and POST
  // Present in GET, missing in POST:
  createdById?: string;
  updatedAt?: string;
  // Present in POST, missing in GET:
  memberCount?: number;
  memberSummary?: MemberSummary[];
  subjects?: unknown[];
  fields?: unknown[];
  // TODO: ask Daniela / Murilo to add these to GET /workspaces:
  //   - userRole (so we don't have to derive from createdById)
  //   - taskCount (currently always 0)
}

// ── Workspace (UI shape used by Dashboard cards) ──────────────────────────────
// Built from WorkspaceDto + local concerns (accent derived from id, starred from localStorage).
export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  accent: string;          // derived from id hash
  label: string;           // first letter of name, uppercased
  time: string;            // human readable, derived from updatedAt or createdAt
  members: string[];       // placeholder avatar letters from memberCount or memberSummary
  starred: boolean;        // local-only flag from localStorage
  userRole: WorkspaceRole;
  memberCount: number;
  taskCount: number;
  lastActivityAt: string;
  createdAt: string;
}

// ── Inputs for mutating endpoints ─────────────────────────────────────────────
export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  memberEmails?: string[];
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
}