export type Role = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title?: string;
  department?: string;
  avatar?: string;
  phone?: string;
  location?: string;
  createdAt?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  assigneeId: string;
  assignee?: User | null;
  dueDate: string;
  estimatedHours: number;
  loggedHours: number;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

export interface UserUpdatePayload {
  name?: string;
  title?: string;
  department?: string;
  phone?: string;
  location?: string;
  avatar?: string;
  currentPassword?: string;
  newPassword?: string;
}
