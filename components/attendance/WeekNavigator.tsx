'use client';

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatWeekRange } from '@/lib/dates';

interface WeekNavigatorProps {
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  isCurrentWeek: boolean;
}

export default function WeekNavigator({
  weekStart,
  onPrev,
  onNext,
  onToday,
  isCurrentWeek,
}: WeekNavigatorProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onPrev}
        className="p-1.5 sm:p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700 transition-colors text-gray-600 dark:text-slate-400"
        aria-label="Ҳафтаи гузашта"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex items-center gap-1.5 justify-center px-1">
        <Calendar size={13} className="text-indigo-500 dark:text-indigo-400 flex-shrink-0 hidden sm:block" />
        <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-slate-200 whitespace-nowrap">
          {formatWeekRange(weekStart)}
        </span>
      </div>

      <button
        onClick={onNext}
        className="p-1.5 sm:p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700 transition-colors text-gray-600 dark:text-slate-400"
        aria-label="Ҳафтаи оянда"
      >
        <ChevronRight size={16} />
      </button>

      {!isCurrentWeek && (
        <button
          onClick={onToday}
          className="px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:bg-indigo-200 transition-colors whitespace-nowrap"
        >
          Имрӯз
        </button>
      )}
    </div>
  );
}
