"use client";

import React, { useState, useMemo } from "react";
import { AuthUser } from "@/types";
import { 
  Trash2, Mail, Phone, UserCheck, ShieldCheck, 
  ChevronDown, ChevronUp, Download, Filter, Search 
} from "lucide-react";
import Spinner from "@/components/ui/Spinner";

interface AdminUsersPanelProps {
  users: AuthUser[];
  currentUserId?: number;
  changingRole: number | null;
  deletingId: number | null;
  groupsByMentor: Map<number, number>;
  onRoleChange: (id: number, role: string) => void;
  onDelete: (id: number) => void;
}

const ROLE_LABEL: Record<string, string> = {
  USER: "Истифодабаранда",
  MENTOR: "Ментор",
  TEACHER: "Муаллими Асосӣ",
  ADMIN: "Админ",
};

export default function AdminUsersPanel({
  users,
  currentUserId,
  changingRole,
  deletingId,
  groupsByMentor,
  onRoleChange,
  onDelete,
}: AdminUsersPanelProps) {
  const [sortField, setSortField] = useState<"name" | "role" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Filter & Sort
  const processedUsers = useMemo(() => {
    let result = [...users];
    
    // Filter
    if (roleFilter !== "ALL") {
      result = result.filter(u => u.role === roleFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      } else if (sortField === "role") {
        comparison = a.role.localeCompare(b.role);
      } else if (sortField === "date") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [users, sortField, sortOrder, roleFilter]);

  const toggleSort = (field: "name" | "role" | "date") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggleExpand = (id: number) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  const downloadCSV = () => {
    const headers = ["ID", "Ном", "Насаб", "Имейл", "Телефон", "Рол", "Санаи сабт"];
    const rows = processedUsers.map(u => [
      u.id, u.firstName, u.lastName || "", u.email, u.phone || "", u.role, new Date(u.createdAt).toISOString()
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Ҳамаи ролҳо</option>
            <option value="USER">Истифодабаранда</option>
            <option value="MENTOR">Ментор</option>
            <option value="TEACHER">Муаллим</option>
            <option value="ADMIN">Админ</option>
          </select>
        </div>
        
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
        >
          <Download size={16} />
          Экспорт CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-transparent border-b border-slate-200 dark:border-slate-800/80">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors" onClick={() => toggleSort("name")}>
                  <div className="flex items-center gap-2">Корбар {sortField === "name" && (sortOrder === "asc" ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}</div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors" onClick={() => toggleSort("role")}>
                  <div className="flex items-center gap-2">Рол {sortField === "role" && (sortOrder === "asc" ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}</div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors" onClick={() => toggleSort("date")}>
                  <div className="flex items-center gap-2">Санаи Сабт {sortField === "date" && (sortOrder === "asc" ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}</div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Амалҳо</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {processedUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Ягон корбар ёфт нашуд
                  </td>
                </tr>
              ) : (
                processedUsers.map((u) => {
                  const gCount = groupsByMentor.get(u.id) ?? 0;
                  const isExpanded = expandedRows.has(u.id);

                  return (
                    <React.Fragment key={u.id}>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 shrink-0">
                              {u.firstName[0]}{u.lastName?.[0] || ""}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={u.role}
                            onChange={(e) => onRoleChange(u.id, e.target.value)}
                            disabled={u.id === currentUserId || changingRole === u.id}
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border focus:outline-none transition-colors disabled:opacity-50 appearance-none cursor-pointer ${
                              u.role === 'USER' ? 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' :
                              u.role === 'ADMIN' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' :
                              u.role === 'TEACHER' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                              'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'
                            }`}
                          >
                            <option value="USER">{ROLE_LABEL.USER}</option>
                            <option value="MENTOR">{ROLE_LABEL.MENTOR}</option>
                            <option value="TEACHER">{ROLE_LABEL.TEACHER}</option>
                            <option value="ADMIN">{ROLE_LABEL.ADMIN}</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleExpand(u.id)}
                              className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                            >
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                            <button
                              onClick={() => onDelete(u.id)}
                              disabled={u.id === currentUserId || deletingId === u.id}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-30"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50 dark:bg-[#020617] border-b border-slate-100 dark:border-slate-800/60">
                          <td colSpan={4} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-3">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Маълумоти Тамос</p>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                    <Mail size={14} className="text-slate-400" /> {u.email}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                    <Phone size={14} className="text-slate-400" /> {u.phone || 'Нишон дода нашудааст'}
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Фаъолият</p>
                                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                                  <p>Гурӯҳҳо: <span className="font-bold">{gCount}</span></p>
                                  <p>Сабт: {new Date(u.createdAt).toLocaleString('ru-RU')}</p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Статус</p>
                                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                                  <div className="flex items-center gap-2">
                                    {u.isEmailVerified ? (
                                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><UserCheck size={14}/> Имейл тасдиқ шудааст</span>
                                    ) : (
                                      <span className="text-amber-600 dark:text-amber-400">Имейл тасдиқ нашудааст</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
