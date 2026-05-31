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
  excused?: boolean;
  excusedReason?: string | null;
  hwSolved?: number | null;
  createdAt: string;
}

export type WeekDay = {
  date: string;
  label: string;
  dayName: string;
  isToday: boolean;
};

/* ─── Attendance report ─── */

export interface StudentReportRow {
  id: number;
  name: string;
  phone: string | null;
  sessions: number;
  present: number;
  absent: number;
  late: number;
  lateMinutes: number;
  excused: number;
  hwSolved: number;
  /** Attendance percentage, 0–100. */
  rate: number;
}

export interface AttendanceReport {
  group: { id: number; name: string; description: string | null };
  mentor: string | null;
  period: { from: string | null; to: string | null };
  /** First / last date with recorded sessions inside the range. */
  rangeStart: string | null;
  rangeEnd: string | null;
  generatedAt: string;
  summary: {
    totalStudents: number;
    totalSessions: number;
    present: number;
    absent: number;
    late: number;
    lateMinutes: number;
    excused: number;
    hwSolved: number;
    avgRate: number;
  };
  students: StudentReportRow[];
}
