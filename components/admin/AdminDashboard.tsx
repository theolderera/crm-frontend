"use client";

import React from "react";
import { AuthUser } from "@/types";
import { 
  Users, UserCheck, Clock, ShieldCheck, 
  BookOpen, GraduationCap, ChevronRight, Activity
} from "lucide-react";
import { AdminTab } from "./AdminSidebar";
import Spinner from "@/components/ui/Spinner";

interface AdminDashboardProps {
  stats: {
    total: number;
    mentors: number;
    pending: number;
    admins: number;
    groups: number;
    students: number;
  };
  pendingUsers: AuthUser[];
  recentUsers: AuthUser[];
  changingRole: number | null;
  onApprove: (id: number) => void;
  onGoTab: (tab: AdminTab) => void;
}

export default function AdminDashboard({
  stats,
  pendingUsers,
  recentUsers,
  changingRole,
  onApprove,
  onGoTab
}: AdminDashboardProps) {
  
  const statCards = [
    { label: "Ҳамаи Корбарон", value: stats.total, icon: Users, tab: "users" as AdminTab, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10", border: "border-indigo-100 dark:border-indigo-500/20" },
    { label: "Менторҳо", value: stats.mentors, icon: UserCheck, tab: "users" as AdminTab, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-100 dark:border-emerald-500/20" },
    { label: "Дар Интизор", value: stats.pending, icon: Clock, tab: "users" as AdminTab, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-100 dark:border-amber-500/20" },
    { label: "Админҳо", value: stats.admins, icon: ShieldCheck, tab: "users" as AdminTab, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-100 dark:border-rose-500/20" },
    { label: "Гурӯҳҳо", value: stats.groups, icon: BookOpen, tab: "groups" as AdminTab, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-100 dark:border-blue-500/20" },
    { label: "Донишҷӯён", value: stats.students, icon: GraduationCap, tab: "students" as AdminTab, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-100 dark:border-violet-500/20" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Welcome Section */}
      <div className="flex flex-col gap-1.5 mb-2">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Хуш омадед ба Панели Админ</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Шумо метавонед тамоми маълумоти системаро аз ин ҷо идора кунед.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((c, i) => (
          <button
            key={i}
            onClick={() => onGoTab(c.tab)}
            className="group relative bg-white dark:bg-[#0f172a] rounded-2xl p-5 border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all text-left overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br from-transparent to-current opacity-[0.02] dark:opacity-[0.04] pointer-events-none group-hover:scale-110 transition-transform duration-500" />
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} ${c.border} border`}>
                <c.icon size={20} className={c.color} />
              </div>
              <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                {c.value}
              </p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {c.label}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-slate-50/50 dark:bg-transparent">
            <div className="flex items-center gap-2.5">
              <Clock size={16} className="text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Интизори тасдиқ</h2>
            </div>
            {pendingUsers.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-md">
                {pendingUsers.length} нав
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {pendingUsers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ShieldCheck size={32} className="mb-3 opacity-20" />
                <p className="text-sm font-medium">Ҳама корбарон тасдиқ шудаанд</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {pendingUsers.map(u => (
                  <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                        {u.firstName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onApprove(u.id)}
                      disabled={changingRole === u.id}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {changingRole === u.id ? <Spinner size="sm" /> : <UserCheck size={14} />}
                      Тасдиқ
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed (Recent Users) */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-transparent">
            <div className="flex items-center gap-2.5">
              <Activity size={16} className="text-indigo-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Корбарони Охирин</h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {recentUsers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Users size={32} className="mb-3 opacity-20" />
                <p className="text-sm font-medium">Ягон корбар ёфт нашуд</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentUsers.slice(0, 10).map((u, i) => (
                  <div key={u.id} className="relative pl-6">
                    {/* Timeline line */}
                    {i !== Math.min(recentUsers.length, 10) - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-slate-200 dark:bg-slate-800" />
                    )}
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-slate-50 dark:bg-[#020617] border-2 border-indigo-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800/60 rounded-xl p-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                      <p className="text-sm text-slate-900 dark:text-white">
                        <span className="font-bold">{u.firstName} {u.lastName}</span> сабти ном кард
                      </p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                        {new Date(u.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
