import type { DashboardSummary, Employee } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
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
    throw new Error(error.error?.message || 'Request failed');
  }

  const data = await response.json();
  return data.data;
}

export async function fetchEmployees(): Promise<Employee[]> {
  return apiRequest('/api/employees');
}

export async function fetchBrands() {
  return apiRequest('/api/brands');
}

export async function fetchDashboardSummary(month: number, year: number): Promise<DashboardSummary> {
  return apiRequest(`/api/dashboard/summary?month=${month}&year=${year}`);
}
