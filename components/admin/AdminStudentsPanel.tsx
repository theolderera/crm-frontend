"use client";

import React, { useState, useMemo } from "react";
import { Student } from "@/types";
import { 
  GraduationCap, Trash2, Search, Filter, Download, Phone 
} from "lucide-react";

interface AdminStudentsPanelProps {
  students: Student[];
  deletingId: number | null;
  onDelete: (id: number) => void;
}

export default function AdminStudentsPanel({
  students,
  deletingId,
  onDelete,
}: AdminStudentsPanelProps) {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("ALL");

  const groupsList = useMemo(() => {
    const names = new Set<string>();
    students.forEach(s => {
      if (s.group?.name) names.add(s.group.name);
    });
    return Array.from(names).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter(s => {
      const matchSearch = !q || 
        s.firstName.toLowerCase().includes(q) ||
        s.lastName?.toLowerCase().includes(q) ||
        s.phone?.includes(q);
        
      const matchGroup = groupFilter === "ALL" || s.group?.name === groupFilter;
      
      return matchSearch && matchGroup;
    }).sort((a, b) => a.firstName.localeCompare(b.firstName));
  }, [students, search, groupFilter]);

  const downloadCSV = () => {
    const headers = ["ID", "Ном", "Насаб", "Телефон", "Гурӯҳ", "Санаи сабт"];
    const rows = filteredStudents.map(s => [
      s.id, s.firstName, s.lastName || "", s.phone || "", s.group?.name || "Бе гурӯҳ", new Date(s.createdAt).toISOString()
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
        <div className="flex flex-1 items-center gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ҷустуҷӯи донишҷӯ..."
              className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[200px]"
            >
              <option value="ALL">Ҳамаи гурӯҳҳо</option>
              {groupsList.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
        
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors shrink-0"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Экспорт CSV</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-transparent border-b border-slate-200 dark:border-slate-800/80">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Донишҷӯ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Гурӯҳ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Телефон</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Амалҳо</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <GraduationCap size={48} className="mb-4 opacity-20" />
                      <p>Ягон донишҷӯ ёфт нашуд</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold shrink-0">
                          {s.firstName[0]}
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {s.firstName} {s.lastName}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-md">
                        {s.group?.name || "Бе гурӯҳ"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {s.phone ? (
                        <span className="flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {s.phone}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onDelete(s.id)}
                        disabled={deletingId === s.id}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-30"
                        title="Нест кардан"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
