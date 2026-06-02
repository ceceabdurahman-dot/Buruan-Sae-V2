import axios from 'axios';
import { getSession } from 'next-auth/react';

// ============================================================
// API Client — axios dengan auth interceptor
// ============================================================

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Tambahkan token dari NextAuth secara otomatis
apiClient.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// Error handling global
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message ?? error.message;

    if (status === 401) {
      // Token expired — redirect ke login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(new Error(message));
  }
);
