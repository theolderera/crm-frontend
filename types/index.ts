export interface AuthUser {
  id: number;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  role: 'PENDING' | 'MENTOR' | 'ADMIN';
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  mentorId?: number;
  students: Student[];
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: number;
  firstName: string;
  lastName?: string;
  phone?: string;
  groupId: number;
  group?: Group;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: number;
  studentId: number;
  date: string;
  present: boolean;
  lateMinutes?: number | null;
  lateNote?: string | null;
  createdAt: string;
}

export type WeekDay = {
  date: string;
  label: string;
  dayName: string;
  isToday: boolean;
};
