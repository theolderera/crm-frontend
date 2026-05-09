'use client';

import { Group } from '@/types';
import { Users, Edit2, Trash2, ChevronRight } from 'lucide-react';

interface GroupCardProps {
  group: Group;
  isActive: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function GroupCard({ group, isActive, onClick, onEdit, onDelete }: GroupCardProps) {
  return (
    <div
      className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-200 border-2 ${
        isActive
          ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50'
          : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md dark:hover:shadow-slate-900'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className={`flex items-center gap-2 mb-1 ${isActive ? 'text-white' : 'text-gray-900 dark:text-slate-100'}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isActive ? 'bg-indigo-500' : 'bg-indigo-50 dark:bg-indigo-900/50'
            }`}>
              <Users size={16} className={isActive ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'} />
            </div>
            <h3 className="font-semibold text-sm truncate">{group.name}</h3>
          </div>
          {group.description && (
            <p className={`text-xs truncate ml-10 ${isActive ? 'text-indigo-200' : 'text-gray-500 dark:text-slate-400'}`}>
              {group.description}
            </p>
          )}
          <div className={`flex items-center gap-1.5 mt-2 ml-10 text-xs font-medium ${
            isActive ? 'text-indigo-200' : 'text-gray-500 dark:text-slate-400'
          }`}>
            <Users size={12} />
            <span>{group.students?.length ?? 0} талаба</span>
          </div>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onEdit}
            className={`p-1.5 rounded-lg transition-colors ${
              isActive
                ? 'hover:bg-indigo-500 text-indigo-200 hover:text-white'
                : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
            }`}
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={onDelete}
            className={`p-1.5 rounded-lg transition-colors ${
              isActive
                ? 'hover:bg-indigo-500 text-indigo-200 hover:text-red-300'
                : 'hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 dark:text-slate-500 hover:text-red-500'
            }`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {isActive && <ChevronRight size={16} className="absolute right-3 bottom-3 text-indigo-300" />}
    </div>
  );
}
