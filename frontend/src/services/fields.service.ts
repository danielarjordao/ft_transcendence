import api from './api';

export interface Field {
  id: string;
  label: string;
  color: string;
  order: number;
  workspaceId: string;
}

export interface CreateFieldDto {
  label: string;
  color: string;
  order?: number;
}

export const fieldsService = {
  // ✅ GET /api/workspaces/:workspaceId/fields
  async getAll(workspaceId: string): Promise<Field[]> {
    const response = await api.get(`/workspaces/${workspaceId}/fields`);
    return response.data;
  },

  // ✅ POST /api/workspaces/:workspaceId/fields
  async create(
    workspaceId: string, 
    data: CreateFieldDto
  ): Promise<Field> {
    const response = await api.post(
      `/workspaces/${workspaceId}/fields`, 
      data
    );
    return response.data;
  },

  // ✅ PATCH /api/fields/:id
  async update(
    id: string, 
    data: Partial<CreateFieldDto>
  ): Promise<Field> {
    const response = await api.patch(`/fields/${id}`, data);
    return response.data;
  },

  // ✅ DELETE /api/fields/:id
  async delete(id: string): Promise<void> {
    await api.delete(`/fields/${id}`);
  },

  // ✅ PATCH /api/fields/reorder
  async reorder(workspaceId: string, fieldIds: string[]): Promise<void> {
    await api.patch('/fields/reorder', {
      workspaceId,
      fieldIds,
    });
  },
};