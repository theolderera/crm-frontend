"use client";

import React, { useState, useEffect } from "react";
import { reportsApi } from "@/lib/api";
import { StudentReportRow } from "@/types";
import { formatStudentName } from "@/lib/formatters";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Trophy, Check, Clock, Info, BookOpen, Star, CalendarDays } from "lucide-react";
import toast from "react-hot-toast";
import { getMonthlyRatingRange } from "@/lib/dates";

interface LeaderboardPanelProps {
  groupId: number;
}

interface RankedStudent extends StudentReportRow {
  xp: number;
  rank: number;
}

export default function LeaderboardPanel({ groupId }: LeaderboardPanelProps) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<RankedStudent[]>([]);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const { from, to } = getMonthlyRatingRange();
        const report = await reportsApi.getAttendance({ groupId, from, to });
        if (!mounted) return;
        
        // Calculate XP for each student
        const ranked = report.students.map(student => {
          const presentOnTime = student.present - student.late;
          
          const xp = 
            (presentOnTime * 10) +
            (student.late * 7) +
            (student.excused * 5) +
            (student.hwSolved * 5);

          return { ...student, xp, rank: 0 };
        });

        // Sort by XP descending, then by name
        ranked.sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));
        
        let currentRank = 1;
        ranked.forEach((s, i) => {
          if (i > 0 && s.xp < ranked[i - 1].xp) {
            currentRank = i + 1;
          }
          s.rank = currentRank;
        });

        setStudents(ranked);
      } catch {
        if (mounted) toast.error("Маълумоти рейтинг бор нашуд");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    loadData();
    return () => { mounted = false; };
  }, [groupId]);

  if (loading && students.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 flex flex-col min-h-[400px]">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton variant="circular" width={40} height={40} />
          <div>
            <Skeleton width={150} height={20} className="mb-2" />
            <Skeleton width={100} height={12} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={60} className="w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-12 flex flex-col items-center justify-center min-h-[400px]">
        <EmptyState 
          icon={Trophy} 
          title="Ҳанӯз рейтинг нест" 
          description="Пас аз гузаронидани дарсҳо рейтинг пайдо мешавад." 
        />
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col transition-opacity duration-300 font-sans ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
      {loading && (
        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full bg-indigo-500 animate-pulse" style={{ width: '100%', animation: 'progress 1s ease-in-out infinite' }} />
        </div>
      )}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-transparent flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Рейтинги гурӯҳ</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
              <CalendarDays size={12} /> {getMonthlyRatingRange().label.replace('Рейтинги моҳона ', '')}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-transparent border-b border-slate-200 dark:border-slate-800/80">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-20 text-center">Ҷой</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Донишҷӯ</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ҳузур</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Масъалаҳо</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Хол (XP)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {students.map((student) => {
              const isTop3 = student.rank <= 3;
              
              return (
                <tr 
                  key={student.id} 
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group ${
                    isTop3 ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''
                  }`}
                >
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${
                        student.rank === 1 ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' :
                        student.rank === 2 ? 'bg-indigo-500 text-white border-indigo-600' :
                        student.rank === 3 ? 'bg-indigo-400 text-white border-indigo-500' :
                        'bg-slate-100 dark:bg-[#020617] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        {student.rank}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        isTop3 
                          ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' 
                          : 'bg-slate-100 dark:bg-[#020617] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                      }`}>
                        {student.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className={`font-bold text-sm ${isTop3 ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-white'}`}>
                        {student.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400" title="Ҳозир">
                        <Check size={14} /> {student.present}
                      </span>
                      {student.late > 0 && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400" title="Дер омад">
                          <Clock size={14} /> {student.late}
                        </span>
                      )}
                      {student.excused > 0 && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400" title="Сабабнок">
                          <Info size={14} /> {student.excused}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                      <BookOpen size={14} />
                      {student.hwSolved}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 font-black text-slate-900 dark:text-white">
                      {student.xp}
                      <Star size={14} className={isTop3 ? "text-indigo-500 fill-indigo-500" : "text-slate-400"} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
