// frontend/src/services/tasks.service.ts
import api from './api';
import type { Task } from '../components/kanban/TaskCard';

// Filtros para buscar tasks (opcional)
export interface TaskFilters {
  search?: string; // Buscar por título
  priority?: 'low' | 'medium' | 'high'; // Filtrar por prioridade
  status?: string; // Filtrar por status/column
  assignee?: string; // Filtrar por assignee ID
  subject?: string; // Filtrar por subject ID
  dueFrom?: string; // Tasks com due date >= esta data
  dueTo?: string; // Tasks com due date <= esta data
  sortBy?: 'dueDate' | 'title' | 'priority' | 'createdAt'; // Ordenar por
  sortOrder?: 'asc' | 'desc'; // Ordem crescente/decrescente
  limit?: number; // Quantas tasks retornar (paginação)
  offset?: number; // Pular N tasks (paginação)
}

// Dados para criar uma nova task
export interface CreateTaskDto {
  title: string;
  description?: string;
  status: string; // Campo slug: 'todo', 'in_progress', 'done'
  priority?: 'low' | 'medium' | 'high';
  subjectId?: string;
  assigneeId?: string;
  dueDate?: string; // ISO date string
}

// Dados para atualizar uma task existente
export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: string;
  priority?: 'low' | 'medium' | 'high';
  subjectId?: string;
  assigneeId?: string;
  dueDate?: string;
}

// Resposta paginada do backend
export interface TasksResponse {
  items: Task[];
  pageInfo: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

// ===== SERVIÇO =====
export const tasksService = {
  /**
   * GET /api/workspaces/:wsId/tasks
   * Busca todas as tasks de um workspace com filtros opcionais
   */
  async getAll(
    workspaceId: string,
    filters?: TaskFilters
  ): Promise<TasksResponse> {
    const response = await api.get(`/workspaces/${workspaceId}/tasks`, {
      params: filters, // axios converte automaticamente para query params
    });
    return response.data;
  },

  /**
   * GET /api/tasks/:taskId
   * Busca uma task específica pelo ID
   */
  async getById(taskId: string): Promise<Task> {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  /**
   * POST /api/workspaces/:wsId/tasks
   * Cria uma nova task no workspace
   */
  async create(workspaceId: string, data: CreateTaskDto): Promise<Task> {
    const response = await api.post(`/workspaces/${workspaceId}/tasks`, data);
    return response.data;
  },

  /**
   * PATCH /api/tasks/:taskId
   * Atualiza uma task existente
   */
  async update(taskId: string, data: UpdateTaskDto): Promise<Task> {
    const response = await api.patch(`/tasks/${taskId}`, data);
    return response.data;
  },

  /**
   * DELETE /api/tasks/:taskId
   * Deleta uma task
   */
  async delete(taskId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}`);
  },
};