import { Student } from '@/types';

export function formatStudentName(student: Pick<Student, 'firstName' | 'lastName'>): string {
  return [student.firstName, student.lastName].filter(Boolean).join(' ');
}

export function getStudentInitials(student: Pick<Student, 'firstName' | 'lastName'>): string {
  const first = student.firstName?.[0] ?? '';
  const last = student.lastName?.[0] ?? '';
  return (first + last).toUpperCase();
}

export function getApiError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as any).response;
    if (Array.isArray(res?.data?.message)) return res.data.message[0];
    if (typeof res?.data?.message === 'string') return res.data.message;
  }
  return 'Хатогӣ рӯй дод';
}
