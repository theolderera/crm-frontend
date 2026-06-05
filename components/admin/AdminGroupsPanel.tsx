"use client";

import React, { useState, useMemo } from "react";
import { Group, AuthUser } from "@/types";
import { 
  BookOpen, Trash2, Eye, UserCircle, 
  Users2, ChevronRight, Search 
} from "lucide-react";

type AdminGroup = Group & { mentor?: AuthUser };

interface AdminGroupsPanelProps {
  groups: AdminGroup[];
  deletingId: number | null;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function AdminGroupsPanel({
  groups,
  deletingId,
  onOpen,
  onDelete,
}: AdminGroupsPanelProps) {
  const [search, setSearch] = useState("");

  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase();
    return groups.filter(g => 
      !q || 
      g.name.toLowerCase().includes(q) ||
      g.mentor?.firstName.toLowerCase().includes(q) ||
      g.mentor?.lastName?.toLowerCase().includes(q)
    );
  }, [groups, search]);

  if (groups.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <BookOpen size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-medium">Ягон гурӯҳ ёфт нашуд</p>
      </div>
    );

  const mentorName = (g: AdminGroup) =>
    g.mentor
      ? [g.mentor.firstName, g.mentor.lastName].filter(Boolean).join(" ")
      : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ҷустуҷӯи гурӯҳ ё ментор..."
            className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map((g) => (
          <div
            key={g.id}
            onClick={() => onOpen(g.id)}
            className="group relative bg-white dark:bg-[#0f172a] rounded-2xl p-5 border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all cursor-pointer flex flex-col h-full"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                  <BookOpen size={20} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{g.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(g.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
            </div>

            <div className="flex flex-col gap-2.5 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <UserCircle size={16} />
                  <span>Ментор</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-slate-200">
                  {mentorName(g) ?? "Таъин нашудааст"}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Users2 size={16} />
                  <span>Донишҷӯён</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {g.students?.length || 0}
                </span>
              </div>
            </div>

            {/* Actions overlay on hover */}
            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(g.id);
                }}
                disabled={deletingId === g.id}
                className="p-2 bg-white dark:bg-[#0f172a] text-slate-400 hover:text-rose-500 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm transition-colors hover:border-rose-200 dark:hover:border-rose-500/30 disabled:opacity-50"
                title="Нест кардан"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
