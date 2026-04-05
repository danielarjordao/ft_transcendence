import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, Subject } from '../components/kanban/TaskCard';

export interface Workspace {
  id: string;
  name: string;
  accent: string;
  label: string;
  time: string;
  members: string[];
  starred: boolean;
}

interface BoardData {
  tasks: Task[];
  subjects: Subject[];
  fields: { id: string; label: string; color: string }[];
}

interface WorkspaceState {
  workspaces: Workspace[];
  boards: Record<string, BoardData>;
  addWorkspace: (ws: Workspace) => void;
  removeWorkspace: (id: string) => void;
  renameWorkspace: (id: string, name: string) => void;
  toggleStar: (id: string) => void;
  updateBoard: (workspaceId: string, data: Partial<BoardData>) => void;
  getBoard: (workspaceId: string) => BoardData;
}

const DEFAULT_FIELDS = [
  { id: 'todo',        label: 'To Do',       color: '#888888' },
  { id: 'in_progress', label: 'In Progress', color: '#FFA500' },
  { id: 'done',        label: 'Done',        color: '#50C878' },
];

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      boards: {},

      addWorkspace: (ws) =>
        set(state => ({ workspaces: [ws, ...state.workspaces] })),

      removeWorkspace: (id) =>
        set(state => {
          const boards = { ...state.boards };
          delete boards[id];
          return {
            workspaces: state.workspaces.filter(w => w.id !== id),
            boards,
          };
        }),

      renameWorkspace: (id, name) =>
        set(state => ({
          workspaces: state.workspaces.map(w =>
            w.id === id
              ? { ...w, name, label: name[0].toUpperCase(), time: 'Just now' }
              : w
          ),
        })),

      toggleStar: (id) =>
        set(state => ({
          workspaces: state.workspaces.map(w =>
            w.id === id ? { ...w, starred: !w.starred } : w
          ),
        })),

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
    }),
    {
      name: 'fazelo-workspaces',
    }
  )
);