import { create } from 'zustand';
import { User, AuthResponse, UserUpdatePayload } from '../types';
import { apiFetch, setAuthToken, getAuthToken } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, title?: string, department?: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (payload: UserUpdatePayload) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getAuthToken(),
  isAuthenticated: !!getAuthToken(),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (res.token && res.user) {
        setAuthToken(res.token);
        set({
          token: res.token,
          user: res.user,
          isAuthenticated: true,
          isLoading: false
        });
        return true;
      }
      set({ isLoading: false, error: res.message || 'Login failed' });
      return false;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Network error occurred' });
      return false;
    }
  },

  register: async (name, email, password, title, department) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, title, department })
      });

      if (res.token && res.user) {
        setAuthToken(res.token);
        set({
          token: res.token,
          user: res.user,
          isAuthenticated: true,
          isLoading: false
        });
        return true;
      }
      set({ isLoading: false, error: res.message || 'Registration failed' });
      return false;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Registration failed' });
      return false;
    }
  },

  logout: () => {
    setAuthToken(null);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null
    });
  },

  checkAuth: async () => {
    const token = getAuthToken();
    if (!token) {
      set({ isAuthenticated: false, user: null, token: null });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await apiFetch<{ success: boolean; user: User }>('/auth/me');
      if (res.success && res.user) {
        set({
          user: res.user,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        setAuthToken(null);
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch (err) {
      setAuthToken(null);
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiFetch<{ success: boolean; message: string; user: User }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (res.success && res.user) {
        set({ user: res.user, isLoading: false });
        return true;
      }
      set({ isLoading: false, error: res.message || 'Update failed' });
      return false;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Update failed' });
      return false;
    }
  },

  clearError: () => set({ error: null })
}));
