import type { DashboardSummary, Employee } from '../types/api';

function normalizeBaseURL(url: string): string {
  let base = url || 'http://localhost:4000';
  base = base.replace(/\/+$/, '');
  if (base.endsWith('/api')) {
    base = base.slice(0, -4);
  }
  return base;
}

const API_BASE = normalizeBaseURL(import.meta.env.VITE_API_URL);

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}/api${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: { message: 'Request failed' },
    }));
    const message = error.error?.message || error.message || 'Request failed';
    throw new Error(message);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  const body = await response.json();
  
  if (typeof body === 'object' && body !== null && !Array.isArray(body) && 'data' in body) {
    return body.data as T;
  }
  
  return body as T;
}

export const api = {
  get: async <T = unknown>(endpoint: string, options?: { responseType?: 'blob' }): Promise<{ data: T }> => {
    if (options?.responseType === 'blob') {
      const url = `${API_BASE}/api${endpoint}`;
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: { message: 'Request failed' },
        }));
        const message = error.error?.message || error.message || 'Request failed';
        throw new Error(message);
      }
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return { data: undefined as T };
      }
      const blob = await response.blob();
      return { data: blob as T };
    }
    const result = await apiRequest<T>(endpoint);
    return { data: result };
  },
  post: async <T = unknown>(endpoint: string, body?: unknown): Promise<{ data: T }> => {
    const result = await apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return { data: result };
  },
  put: async <T = unknown>(endpoint: string, body?: unknown): Promise<{ data: T }> => {
    const result = await apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return { data: result };
  },
  delete: async <T = unknown>(endpoint: string): Promise<{ data: T }> => {
    const result = await apiRequest<T>(endpoint, {
      method: 'DELETE',
    });
    return { data: result };
  },
  defaults: {
    get baseURL() {
      return `${API_BASE}/api`;
    },
  },
};

export async function fetchEmployees(): Promise<Employee[]> {
  return apiRequest('/employees');
}

export async function fetchBrands() {
  return apiRequest('/brands');
}

export async function fetchDashboardSummary(month: number, year: number): Promise<DashboardSummary> {
  return apiRequest(`/dashboard/summary?month=${month}&year=${year}`);
}
