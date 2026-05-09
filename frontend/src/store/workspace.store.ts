import { create } from 'zustand';
import type { Task, Subject } from '../components/kanban/TaskCard';
import type {
  Workspace,
  WorkspaceDto,
  WorkspaceRole,
  CreateWorkspaceInput,
  MemberSummary,
} from '../types/workspace';
import { workspacesService } from '../services/workspaces.service';
import { useAuthStore } from './auth.store';

// Re-export so existing imports from this module keep working.
export type { Workspace } from '../types/workspace';

// ── Local-only board cache (kept until backend tasks API is connected) ────────
interface BoardData {
  tasks: Task[];
  subjects: Subject[];
  fields: { id: string; label: string; color: string }[];
}

const DEFAULT_FIELDS = [
  { id: 'todo',        label: 'To Do',       color: '#888888' },
  { id: 'in_progress', label: 'In Progress', color: '#FFA500' },
  { id: 'done',        label: 'Done',        color: '#50C878' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const ACCENT_COLORS = [
  '#7B68EE', '#4A90D9', '#50C878', '#FFA500',
  '#FF6B6B', '#E87D7D', '#4ECDC4', '#9B8EC4',
];

const STARRED_KEY = 'fazelo:starred-workspaces';

function loadStarred(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STARRED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set<string>(arr) : new Set();
  } catch {
    return new Set();
  }
}

function saveStarred(set: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STARRED_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore quota errors
  }
}

function deriveAccent(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return ACCENT_COLORS[Math.abs(hash) % ACCENT_COLORS.length];
}

function formatRelativeTime(iso: string | undefined): string {
  if (!iso) return 'recently';
  const then = new Date(iso).getTime();
  if (isNaN(then)) return 'recently';
  const diff = Math.max(0, Date.now() - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr > 1 ? 's' : ''} ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} day${day > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString();
}

function avatarLetters(memberSummary: MemberSummary[] | undefined, memberCount: number | undefined): string[] {
  // Prefer real usernames when backend includes them (POST response).
  if (memberSummary && memberSummary.length > 0) {
    return memberSummary.slice(0, 3).map(m => (m.username[0] ?? '?').toUpperCase());
  }
  // Otherwise, just show as many placeholders as memberCount, capped at 3.
  // TODO: replace once backend includes first 3 members in GET /workspaces.
  const count = Math.max(0, Math.min(memberCount ?? 0, 3));
  const placeholders = ['A', 'L', 'M', 'D'];
  return placeholders.slice(0, count);
}

function deriveUserRole(createdById: string | undefined): WorkspaceRole {
  // Until backend includes userRole in responses, derive locally.
  // Rule (confirmed by Ana): owner if I created it, member otherwise.
  // Owner can later promote members to admin/owner via separate endpoint.
  const currentUserId = useAuthStore.getState().user?.id;
  if (!createdById) {
    // POST /workspaces does not return createdById, but the requester is always the creator.
    return 'owner';
  }
  return createdById === currentUserId ? 'owner' : 'member';
}

function dtoToClient(dto: WorkspaceDto, starredIds: Set<string>): Workspace {
  const lastActivityAt = dto.updatedAt ?? dto.createdAt;
  const memberCount    = dto.memberCount ?? (dto.memberSummary?.length ?? 0);

  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? null,
    accent: deriveAccent(dto.id),
    label: (dto.name[0] ?? '?').toUpperCase(),
    time: formatRelativeTime(lastActivityAt),
    members: avatarLetters(dto.memberSummary, memberCount),
    starred: starredIds.has(dto.id),
    userRole: deriveUserRole(dto.createdById),
    memberCount,
    taskCount: 0, // backend does not provide yet
    lastActivityAt,
    createdAt: dto.createdAt,
  };
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as {
      response?: { data?: { message?: string | string[] } };
      message?: string;
    };
    const msg = e.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    if (typeof e.message === 'string') return e.message;
  }
  return fallback;
}

// ── Store ─────────────────────────────────────────────────────────────────────
interface WorkspaceState {
  // Data
  workspaces: Workspace[];
  boards: Record<string, BoardData>;
  // UI state
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  // Actions: API-backed
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (input: CreateWorkspaceInput) => Promise<Workspace>;
  renameWorkspace: (id: string, name: string) => Promise<void>;
  removeWorkspace: (id: string) => Promise<void>;
  // Actions: local-only
  toggleStar: (id: string) => void;
  // Boards (local cache, will move to API when tasks endpoint is available)
  updateBoard: (workspaceId: string, data: Partial<BoardData>) => void;
  getBoard: (workspaceId: string) => BoardData;
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  workspaces: [],
  boards: {},
  loading: false,
  error: null,
  hydrated: false,

  fetchWorkspaces: async () => {
    set({ loading: true, error: null });
    try {
      const dtos = await workspacesService.listWorkspaces();
      const starred = loadStarred();
      const workspaces = dtos.map(d => dtoToClient(d, starred));
      set({ workspaces, loading: false, hydrated: true });
    } catch (err) {
      set({
        loading: false,
        hydrated: true,
        error: extractErrorMessage(err, 'Failed to load workspaces.'),
      });
    }
  },

  createWorkspace: async (input) => {
    const dto = await workspacesService.createWorkspace(input);
    const starred = loadStarred();
    const ws = dtoToClient(dto, starred);
    set(state => ({ workspaces: [ws, ...state.workspaces] }));
    return ws;
  },

  renameWorkspace: async (id, name) => {
    const dto = await workspacesService.updateWorkspace(id, { name });
    const starred = loadStarred();
    const updated = dtoToClient(dto, starred);
    set(state => ({
      workspaces: state.workspaces.map(w => (w.id === id ? updated : w)),
    }));
  },

  removeWorkspace: async (id) => {
    await workspacesService.deleteWorkspace(id);
    set(state => {
      const boards = { ...state.boards };
      delete boards[id];
      return {
        workspaces: state.workspaces.filter(w => w.id !== id),
        boards,
      };
    });
    const starred = loadStarred();
    if (starred.delete(id)) saveStarred(starred);
  },

  toggleStar: (id) => {
    const starred = loadStarred();
    if (starred.has(id)) starred.delete(id);
    else starred.add(id);
    saveStarred(starred);
    set(state => ({
      workspaces: state.workspaces.map(w =>
        w.id === id ? { ...w, starred: starred.has(id) } : w
      ),
    }));
  },

  updateBoard: (workspaceId, data) =>
    set(state => ({
      boards: {
        ...state.boards,
        [workspaceId]: {
          ...get().getBoard(workspaceId),
          ...data,
        },
      },
    })),

  getBoard: (workspaceId) =>
    get().boards[workspaceId] ?? {
      tasks: [],
      subjects: [],
      fields: DEFAULT_FIELDS,
    },
}));