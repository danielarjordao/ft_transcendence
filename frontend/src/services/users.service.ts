import api from './api';
import type {
  AvatarUploadResponse,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
} from '../types/auth';

export const usersService = {
  async updateProfile(data: ProfileUpdateRequest): Promise<ProfileUpdateResponse> {
    const response = await api.patch<ProfileUpdateResponse>('/users/me', data);
    return response.data;
  },

  async uploadAvatar(file: File): Promise<AvatarUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<AvatarUploadResponse>('/users/avatar', formData);

    return response.data;
  },
};
