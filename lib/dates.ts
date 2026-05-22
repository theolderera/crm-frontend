import { startOfWeek, addWeeks, format, addDays } from 'date-fns';
import { WeekDay } from '@/types';

const DAY_NAMES_TJ = ['Якшанбе', 'Душанбе', 'Сешанбе', 'Чоршанбе', 'Панҷшанбе', 'Ҷумъа', 'Шанбе'];
const DAY_NAMES_SHORT = ['ЯК', 'ДУ', 'СЕ', 'ЧО', 'ПА', 'ҶУ', 'ША'];
const MONTHS_TJ = [
  'Январ', 'Феврал', 'Март', 'Апрел', 'Май', 'Июн',
  'Июл', 'Август', 'Сентябр', 'Октябр', 'Ноябр', 'Декабр',
];

export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getWeekDays(weekStart: Date): WeekDay[] {
  const today = formatDate(new Date());
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const dateStr = formatDate(d);
    const dayIndex = d.getDay();
    return {
      date: dateStr,
      label: `${DAY_NAMES_SHORT[dayIndex]} ${d.getDate()}`,
      dayName: DAY_NAMES_TJ[dayIndex],
      isToday: dateStr === today,
    };
  });
}

export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const startMonth = MONTHS_TJ[weekStart.getMonth()];
  const endMonth = MONTHS_TJ[weekEnd.getMonth()];
  const year = weekEnd.getFullYear();

  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${weekStart.getDate()}–${weekEnd.getDate()} ${startMonth} ${year}`;
  }
  return `${weekStart.getDate()} ${startMonth} – ${weekEnd.getDate()} ${endMonth} ${year}`;
}

export function navigateWeek(weekStart: Date, direction: 'prev' | 'next'): Date {
  return addWeeks(weekStart, direction === 'next' ? 1 : -1);
}

/** Formats an ISO `yyyy-MM-dd` string as `dd.MM.yyyy` for display. */
export function formatDMY(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}
