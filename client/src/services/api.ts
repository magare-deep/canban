const API_BASE_URL = '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('canban_jwt_token');
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('canban_jwt_token', token);
  } else {
    localStorage.removeItem('canban_jwt_token');
  }
};

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data as T;
}
