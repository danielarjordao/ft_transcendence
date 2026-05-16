import api from './api';

export interface Subject {
  id: string;
  name: string;
  color: string;
  workspaceId: string;
}

export interface CreateSubjectDto {
  name: string;
  color: string;
}

export const subjectsService = {
  // ✅ GET /api/workspaces/:workspaceId/subjects
  async getAll(workspaceId: string): Promise<Subject[]> {
    const response = await api.get(`/workspaces/${workspaceId}/subjects`);
    return response.data;
  },

  // ✅ POST /api/workspaces/:workspaceId/subjects
  async create(
    workspaceId: string, 
    data: CreateSubjectDto
  ): Promise<Subject> {
    const response = await api.post(
      `/workspaces/${workspaceId}/subjects`, 
      data
    );
    return response.data;
  },

  // ✅ PATCH /api/subjects/:id
  async update(
    id: string, 
    data: Partial<CreateSubjectDto>
  ): Promise<Subject> {
    const response = await api.patch(`/subjects/${id}`, data);
    return response.data;
  },

  // ✅ DELETE /api/subjects/:id
  async delete(id: string): Promise<void> {
    await api.delete(`/subjects/${id}`);
  },
};