"use client";

import React, { useState } from "react";
import Logo from "@/components/ui/Logo";
import {
  Users,
  LogOut,
  Trophy,
  Plus,
  MessageSquareHeart,
  UserCircle,
  FolderOpen,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { AuthUser, Group, CourseMonth } from "@/types";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface ClientSidebarProps {
  months: CourseMonth[];
  selectedGroupId: number | null;
  onGroupSelect: (group: Group) => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onNewMonth?: () => void;
  onNewGroup?: (courseMonthId: number) => void;
  onGlobalLeaderboard: () => void;
  onSupport: () => void;
  onProfile: () => void;
}

export default function ClientSidebar({
  months,
  selectedGroupId,
  onGroupSelect,
  currentUser,
  onLogout,
  onNewMonth,
  onNewGroup,
  onGlobalLeaderboard,
  onSupport,
  onProfile
}: ClientSidebarProps) {
  const isMentor = currentUser?.role === "MENTOR";
  const [expandedMonths, setExpandedMonths] = useState<number[]>([]);

  const toggleMonth = (id: number) => {
    setExpandedMonths(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800/60 shadow-sm dark:shadow-xl z-50 font-sans">
      {/* Header / Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/30">
            <Logo size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="font-bold text-sm tracking-wide text-slate-900 dark:text-white uppercase">Hozir CRM</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide">
        <button
          onClick={onGlobalLeaderboard}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent mb-6"
        >
          <Trophy size={18} />
          <span className="text-sm font-semibold">Рейтинги Умумӣ</span>
        </button>

        <button
          onClick={onSupport}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent mb-6"
        >
          <MessageSquareHeart size={18} />
          <span className="text-sm font-semibold">Дастгирӣ (Support)</span>
        </button>

        <div className="flex items-center justify-between px-2 mb-4">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Контейнерҳо</p>
          {isMentor && (
            <button
              onClick={onNewMonth}
              className="p-1 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded transition-colors flex items-center gap-1 text-[10px] font-bold px-2"
              title="Давраи нав"
            >
              <Plus size={12} /> Нав
            </button>
          )}
        </div>
        
        {months.length === 0 ? (
          <p className="px-2 text-xs text-slate-500 italic">Контейнер ёфт нашуд</p>
        ) : (
          months.map((month) => {
            const isExpanded = expandedMonths.includes(month.id);
            // Auto expand if selected group is inside this month
            const hasSelectedGroup = month.groups.some(g => g.id === selectedGroupId);
            const actuallyExpanded = isExpanded || hasSelectedGroup;

            return (
              <div key={month.id} className="mb-2">
                <div 
                  onClick={() => toggleMonth(month.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderOpen size={16} className="text-indigo-500 shrink-0" />
                    <span className="truncate">{month.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isMentor && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onNewGroup?.(month.id); }}
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Гурӯҳи нав дар ин моҳ"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                    {actuallyExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                  </div>
                </div>

                {actuallyExpanded && (
                  <div className="mt-1 pl-4 space-y-1 relative before:absolute before:left-5 before:top-0 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-slate-800">
                    {month.groups.length === 0 ? (
                      <p className="px-3 py-2 text-[11px] text-slate-400 italic">Гурӯҳ нест</p>
                    ) : (
                      month.groups.map((group) => {
                        const isActive = selectedGroupId === group.id;
                        return (
                          <button
                            key={group.id}
                            onClick={() => onGroupSelect(group)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                              isActive
                                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-500/20"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Users size={14} className="shrink-0" />
                              <span className="text-xs truncate">{group.name}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ml-2 ${
                              isActive 
                                ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300" 
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            }`}>
                              {group.students?.length ?? 0}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/60 shrink-0">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div 
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500/40 transition overflow-hidden" 
            onClick={onProfile} 
            title="Профил"
          >
            {currentUser?.avatar ? (
              <img 
                src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000'}/uploads/avatars/${currentUser.avatar}`} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              currentUser?.firstName[0]
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {currentUser?.firstName} {currentUser?.lastName}
            </p>
            <p className="text-xs text-slate-500 truncate">{currentUser?.role === 'MENTOR' ? 'Ментор' : 'Муаллим'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
          >
            <LogOut size={14} />
            Баромад
          </button>
        </div>
      </div>
    </aside>
  );
}
