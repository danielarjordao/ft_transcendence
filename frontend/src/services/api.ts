import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '../store/auth.store';
import type { TokenPairResponse } from '../types/auth';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuthRefresh?: boolean;
    _retry?: boolean;
  }

  interface InternalAxiosRequestConfig {
    skipAuthRefresh?: boolean;
    _retry?: boolean;
  }
}

type AuthAwareRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  config.headers = config.headers ?? {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (accessToken: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

function isAuthRoute(url?: string) {
  if (!url) {
    return false;
  }

  return (
    url.includes('/auth/sign-in') ||
    url.includes('/auth/sign-up') ||
    url.includes('/auth/2fa/sign-in') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password') ||
    url.includes('/auth/42')
  );
}

function finalizeRefreshQueue(error?: unknown, accessToken?: string) {
  const queued = [...refreshQueue];
  refreshQueue = [];

  queued.forEach(({ resolve, reject }) => {
    if (error || !accessToken) {
      reject(error);
      return;
    }

    resolve(accessToken);
  });
}

async function refreshSession(): Promise<TokenPairResponse> {
  const refreshToken = useAuthStore.getState().refreshToken;
  const response = await api.post<TokenPairResponse>(
    '/auth/refresh',
    refreshToken ? { refreshToken } : {},
    { skipAuthRefresh: true } as AxiosRequestConfig,
  );

  useAuthStore
    .getState()
    .setTokens(response.data.accessToken, response.data.refreshToken);

  return response.data;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as AuthAwareRequestConfig | undefined;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest.skipAuthRefresh ||
      originalRequest._retry ||
      isAuthRoute(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((accessToken) => {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const tokens = await refreshSession();
      finalizeRefreshQueue(undefined, tokens.accessToken);
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      finalizeRefreshQueue(refreshError);
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
