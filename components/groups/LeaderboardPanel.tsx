"use client";

import React, { useState, useEffect, useMemo } from "react";
import { reportsApi } from "@/lib/api";
import { StudentReportRow } from "@/types";
import { getStudentInitials, formatStudentName } from "@/lib/formatters";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { Trophy, Medal, Award, Check, Clock, Info, BookOpen, Star, Calendar } from "lucide-react";
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
          // Present but not late
          const presentOnTime = student.present - student.late;
          
          // XP Formula
          const xp = 
            (presentOnTime * 10) +
            (student.late * 7) +
            (student.excused * 5) +
            (student.hwSolved * 5);

          return { ...student, xp };
        });

        // Sort by XP descending, then by name
        ranked.sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));
        
        // Assign ranks (handle ties if necessary, but simple index is fine for now)
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 flex flex-col min-h-[400px]">
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 flex flex-col items-center justify-center min-h-[400px]">
        <EmptyState 
          icon={Trophy} 
          title="Ҳанӯз рейтинг нест" 
          description="Пас аз гузаронидани дарсҳо рейтинг пайдо мешавад." 
        />
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-opacity duration-300 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
      {loading && (
        <div className="w-full h-1 bg-gray-100 overflow-hidden">
          <div className="h-full bg-amber-500 animate-pulse" style={{ width: '100%', animation: 'progress 1s ease-in-out infinite' }} />
        </div>
      )}
      <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-800 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
          <Trophy size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200">Рейтинги моҳонаи гурӯҳ</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
            <Calendar size={12} /> {getMonthlyRatingRange().label.replace('Рейтинги моҳона ', '')}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6 overflow-auto">
        <div className="grid gap-3 min-w-[600px]">
          {/* Table Header */}
          <div className="grid grid-cols-[60px_1fr_120px_120px] gap-4 px-4 py-2 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
            <div className="text-center">Ҷой</div>
            <div>Донишҷӯ</div>
            <div className="text-center">Омор</div>
            <div className="text-right">Хол (XP)</div>
          </div>

          {/* Student Rows */}
          {students.map((student) => {
            const isTop3 = student.rank <= 3;
            
            return (
              <div 
                key={student.id} 
                className={`grid grid-cols-[60px_1fr_120px_120px] gap-4 items-center px-4 py-3 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                  student.rank === 1 ? 'bg-gradient-to-r from-amber-50 to-yellow-50/30 border-amber-200 dark:from-amber-500/10 dark:to-yellow-500/5 dark:border-amber-500/30 shadow-sm' :
                  student.rank === 2 ? 'bg-gradient-to-r from-slate-50 to-gray-50/30 border-slate-200 dark:from-slate-400/10 dark:to-gray-400/5 dark:border-slate-500/30 shadow-sm' :
                  student.rank === 3 ? 'bg-gradient-to-r from-orange-50 to-red-50/30 border-orange-200 dark:from-orange-700/10 dark:to-red-700/5 dark:border-orange-700/30 shadow-sm' :
                  'bg-white dark:bg-slate-800/50 border-gray-100 dark:border-slate-700/50 hover:border-gray-200 dark:hover:border-slate-600'
                }`}
              >
                {/* Rank */}
                <div className="flex justify-center">
                  {student.rank === 1 ? (
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg shadow-amber-200 dark:shadow-amber-900/20 text-white font-black text-lg">
                      1
                      <Trophy size={14} className="absolute -top-1 -right-1 text-yellow-100 drop-shadow-md" />
                    </div>
                  ) : student.rank === 2 ? (
                    <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-slate-400 shadow-md shadow-slate-200 dark:shadow-slate-900/20 text-white font-bold text-base">
                      2
                      <Medal size={12} className="absolute -top-1 -right-1 text-gray-100" />
                    </div>
                  ) : student.rank === 3 ? (
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 shadow-md shadow-orange-200 dark:shadow-orange-900/20 text-white font-bold text-sm">
                      3
                      <Award size={10} className="absolute -top-1 -right-1 text-orange-100" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-semibold text-sm border border-gray-100 dark:border-slate-700">
                      {student.rank}
                    </div>
                  )}
                </div>

                {/* Student Info */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isTop3 
                      ? 'bg-white/80 dark:bg-slate-900/50 text-gray-800 dark:text-slate-200' 
                      : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    {student.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm ${isTop3 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-slate-200'}`}>
                      {student.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 opacity-80">
                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                        <Check size={10} /> {student.present}
                      </span>
                      {student.late > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                          <Clock size={10} /> {student.late}
                        </span>
                      )}
                      {student.excused > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium text-blue-500 dark:text-blue-400">
                          <Info size={10} /> {student.excused}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1 text-sm font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2.5 py-1 rounded-lg">
                    <BookOpen size={14} />
                    {student.hwSolved}
                  </div>
                  <span className="text-[9px] text-gray-400 dark:text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                    Масъалаҳо
                  </span>
                </div>

                {/* XP */}
                <div className="flex flex-col items-end justify-center">
                  <div className={`text-xl font-black flex items-center gap-1 ${
                    student.rank === 1 ? 'text-amber-500 dark:text-amber-400' :
                    student.rank === 2 ? 'text-slate-500 dark:text-slate-400' :
                    student.rank === 3 ? 'text-orange-500 dark:text-orange-400' :
                    'text-gray-700 dark:text-slate-300'
                  }`}>
                    {student.xp} <Star size={16} className={isTop3 ? "fill-current" : ""} />
                  </div>
                  <div className="w-16 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1 relative">
                    <div 
                      className={`absolute top-0 left-0 h-full rounded-full ${
                        student.rank === 1 ? 'bg-amber-400' :
                        student.rank === 2 ? 'bg-slate-400' :
                        student.rank === 3 ? 'bg-orange-400' :
                        'bg-indigo-400'
                      }`}
                      style={{ width: `${Math.max(5, (student.xp / Math.max(1, students[0].xp)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
