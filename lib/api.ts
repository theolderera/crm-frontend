import axios from 'axios';
import { Group, Student, Attendance, AuthUser } from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('crm_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authApi = {
  register: (data: {
    firstName: string;
    lastName?: string;
    email: string;
    phone: string;
    password: string;
  }) => api.post<{ token: string; user: AuthUser }>('/auth/register', data).then((r) => r.data),

  login: (data: { phone?: string; email?: string; password: string }) =>
    api.post<{ token: string; user: AuthUser }>('/auth/login', data).then((r) => r.data),

  me: () => api.get<AuthUser>('/auth/me').then((r) => r.data),
  
  verifyEmail: (code: string) => 
    api.post<{ success: boolean; message: string }>('/auth/verify-email', { code }).then((r) => r.data),
};

// Admin: Users
export const usersApi = {
  getAll: () => api.get<AuthUser[]>('/users').then((r) => r.data),
  getOne: (id: number) => api.get<AuthUser & { groups: Group[] }>(`/users/${id}`).then((r) => r.data),
  updateRole: (id: number, role: string) =>
    api.patch<AuthUser>(`/users/${id}/role`, { role }).then((r) => r.data),
  deleteUser: (id: number) => api.delete(`/users/${id}`).then((r) => r.data),
  // Admin: all groups across all mentors
  getAllGroups: () => api.get<(Group & { mentor?: AuthUser })[]>('/users/admin/groups').then((r) => r.data),
  // Admin: all students
  getAllStudents: () => api.get<Student[]>('/users/admin/students').then((r) => r.data),
  // Admin: delete student
  deleteStudent: (id: number) => api.delete(`/users/admin/students/${id}`).then((r) => r.data),
  // Admin: delete group
  deleteGroup: (id: number) => api.delete(`/users/admin/groups/${id}`).then((r) => r.data),
};

// Groups
export const groupsApi = {
  getAll: () => api.get<Group[]>('/groups').then((r) => r.data),
  getOne: (id: number) => api.get<Group>(`/groups/${id}`).then((r) => r.data),
  create: (data: { name: string; description?: string }) =>
    api.post<Group>('/groups', data).then((r) => r.data),
  update: (id: number, data: { name?: string; description?: string }) =>
    api.patch<Group>(`/groups/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/groups/${id}`),
};

// Students
export const studentsApi = {
  getAll: () => api.get<Student[]>('/students').then((r) => r.data),
  getByGroup: (groupId: number) =>
    api.get<Student[]>(`/students?groupId=${groupId}`).then((r) => r.data),
  create: (data: {
    firstName: string;
    lastName?: string | null;
    phone?: string | null;
    groupId: number;
  }) => api.post<Student>('/students', data).then((r) => r.data),
  update: (
    id: number,
    data: Partial<{ firstName: string; lastName?: string | null; phone: string | null; groupId: number }>,
  ) => api.patch<Student>(`/students/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/students/${id}`),
};

// Attendance
export const attendanceApi = {
  getWeekly: (groupId: number, weekStart: string) =>
    api
      .get<Attendance[]>(`/attendance/weekly?groupId=${groupId}&weekStart=${weekStart}`)
      .then((r) => r.data),
  upsert: (data: { studentId: number; date: string; present: boolean }) =>
    api.post<Attendance>('/attendance', data).then((r) => r.data),
  bulkUpsert: (data: { date: string; records: { studentId: number; present: boolean }[] }) =>
    api.post('/attendance/bulk', data),
};

export { api };
