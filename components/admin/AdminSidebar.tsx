"use client";

import React from "react";
import Logo from "@/components/ui/Logo";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  LogOut,
  ChevronRight,
  ShieldCheck,
  MessageSquareHeart,
  UserCircle
} from "lucide-react";
import { AuthUser } from "@/types";
import ThemeToggle from "@/components/ui/ThemeToggle";

export type AdminTab = "dashboard" | "users" | "groups" | "students" | "support" | "profile";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  stats: {
    total: number;
    mentors: number;
    pending: number;
    admins: number;
    groups: number;
    students: number;
  };
}

export default function AdminSidebar({
  activeTab,
  onTabChange,
  currentUser,
  onLogout,
  stats
}: AdminSidebarProps) {
  const tabs = [
    { id: "dashboard", label: "Асосӣ", icon: LayoutDashboard },
    { id: "users", label: "Корбарон", icon: Users },
    { id: "groups", label: "Гурӯҳҳо", icon: BookOpen },
    { id: "students", label: "Донишҷӯён", icon: GraduationCap },
    { id: "support", label: "Дастгирӣ", icon: MessageSquareHeart },
    { id: "profile", label: "Профил", icon: UserCircle },
  ] as const;

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800/60 shadow-sm dark:shadow-xl z-50">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/30">
            <Logo size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="font-bold text-sm tracking-wide text-slate-900 dark:text-white uppercase">Super Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide">
        <p className="px-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Меню</p>
        
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon size={18} />
                <span className="text-sm">{tab.label}</span>
              </div>
              {isActive && <ChevronRight size={14} className="text-indigo-500" />}
            </button>
          );
        })}

        <div className="mt-8 mb-4">
          <p className="px-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Статистика</p>
          <div className="space-y-3 px-2">
            <SidebarStat label="Корбарон" value={stats.total} />
            <SidebarStat label="Менторҳо" value={stats.mentors} />
            <SidebarStat label="Гурӯҳҳо" value={stats.groups} />
            <SidebarStat label="Донишҷӯён" value={stats.students} />
            {stats.pending > 0 && (
              <SidebarStat label="Дар интизор" value={stats.pending} highlight />
            )}
          </div>
        </div>
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/60 shrink-0">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div 
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500/40 transition overflow-hidden" 
            onClick={() => onTabChange('profile')} 
            title="Профил"
          >
            {currentUser?.avatar ? (
              <img 
                src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000'}/uploads/avatars/${currentUser.avatar}`} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <ShieldCheck size={18} className="text-indigo-600 dark:text-indigo-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {currentUser?.firstName} {currentUser?.lastName}
            </p>
            <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
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

function SidebarStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
        highlight 
          ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-200 dark:border-amber-500/20" 
          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
      }`}>
        {value}
      </span>
    </div>
  );
}
