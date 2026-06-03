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

export function getMonthlyRatingRange(date: Date = new Date()): { from: string; to: string; label: string } {
  const d = new Date(date);
  const day = d.getDate();
  let month = d.getMonth();
  let year = d.getFullYear();

  if (day < 6) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }

  const fromDate = new Date(year, month, 6);
  const toDate = new Date(year, month + 1, 3);

  const fromStr = formatDate(fromDate);
  const toStr = formatDate(toDate);
  
  const fromMonthName = MONTHS_TJ[fromDate.getMonth()];
  const toMonthName = MONTHS_TJ[toDate.getMonth()];
  
  const label = `Рейтинги моҳона (6 ${fromMonthName.toLowerCase()} – 3 ${toMonthName.toLowerCase()})`;

  return { from: fromStr, to: toStr, label };
}

export function getWeeklyRatingRange(date: Date = new Date()): { from: string; to: string; label: string } {
  const fromDate = startOfWeek(date, { weekStartsOn: 1 });
  const toDate = addDays(fromDate, 6);

  const fromStr = formatDate(fromDate);
  const toStr = formatDate(toDate);
  
  const label = `Рейтинги ҳафтаина (${formatDMY(fromStr)} – ${formatDMY(toStr)})`;

  return { from: fromStr, to: toStr, label };
}

export function getGlobalLeaderboardState(date: Date = new Date()): {
  status: 'weekly' | 'monthly_summary';
  from: string;
  to: string;
  label: string;
} {
  const d = new Date(date);
  const day = d.getDate();
  
  if (day === 4 || day === 5) {
    // Summary of the recently finished month
    const { from, to } = getMonthlyRatingRange(date);
    const fromMonthName = MONTHS_TJ[parseInt(from.split('-')[1], 10) - 1];
    const toMonthName = MONTHS_TJ[parseInt(to.split('-')[1], 10) - 1];
    return {
      status: 'monthly_summary',
      from,
      to,
      label: `Ғолибони Моҳ (6 ${fromMonthName?.toLowerCase()} – 3 ${toMonthName?.toLowerCase()})`
    };
  } else {
    // Weekly: exactly 7-day chunks starting from the 6th of the month
    const { from: monthFrom, to: monthTo } = getMonthlyRatingRange(date);
    const monthStartDate = new Date(monthFrom);
    const monthEndDate = new Date(monthTo);
    
    const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const startDate = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth(), monthStartDate.getDate());
    
    const diffDays = Math.floor((dDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(diffDays / 7);
    
    let weekStart = addDays(monthStartDate, weekIndex * 7);
    let weekEnd = addDays(weekStart, 6);
    
    if (weekEnd > monthEndDate) {
      weekEnd = monthEndDate;
    }
    
    const fromStr = formatDate(weekStart);
    const toStr = formatDate(weekEnd);
    
    return {
      status: 'weekly',
      from: fromStr,
      to: toStr,
      label: `Рейтинги ҳафтаина (${formatDMY(fromStr)} – ${formatDMY(toStr)})`
    };
  }
}

