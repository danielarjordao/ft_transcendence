import api from './api';
import type {
  ChangePasswordRequest,
  TwoFactorSetupResponse,
} from '../types/auth';

export const accountService = {
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await api.patch('/account/password', data);
  },

  async setup2fa(): Promise<TwoFactorSetupResponse> {
    const response = await api.post<TwoFactorSetupResponse>('/account/2fa/setup');
    return response.data;
  },

  async verify2fa(code: string): Promise<void> {
    await api.post('/account/2fa/verify', { code });
  },

  async disable2fa(code: string): Promise<void> {
    await api.delete('/account/2fa', { data: { code } });
  },
};
