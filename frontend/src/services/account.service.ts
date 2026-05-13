import api from './api';
import type { ChangePasswordRequest } from '../types/auth';

export const accountService = {
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await api.patch('/account/password', data);
  },
};
