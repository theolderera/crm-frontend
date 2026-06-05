"use client";

import React, { useState, useEffect } from "react";
import { reportsApi } from "@/lib/api";
import Spinner from "@/components/ui/Spinner";
import Modal from "@/components/ui/Modal";
import { Trophy, Check, BookOpen, Star, Globe, TrendingUp, Users, Crown } from "lucide-react";
import toast from "react-hot-toast";
import { getGlobalLeaderboardState } from "@/lib/dates";

interface GlobalLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalLeaderboardModal({ isOpen, onClose }: GlobalLeaderboardModalProps) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [leaderboardState, setLeaderboardState] = useState<{ status: string; from: string; to: string; label: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const state = getGlobalLeaderboardState();
        if (mounted) setLeaderboardState(state);
        const data = await reportsApi.getGlobalLeaderboard({ from: state.from, to: state.to });
        if (mounted) setStudents(data);
      } catch {
        if (mounted) toast.error("Рейтинги умумӣ бор нашуд");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [isOpen]);

  const isSummary = leaderboardState?.status === 'monthly_summary';
  const topStudents = students.slice(0, isSummary ? 5 : 50);

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={leaderboardState?.label || "Рейтинги Умумӣ"} size="lg">
      <div className="flex flex-col gap-6 font-sans">
        
        {/* Info header */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0 border border-indigo-100 dark:border-indigo-500/20">
            {isSummary ? <Crown size={20} /> : <TrendingUp size={20} />}
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {isSummary 
              ? 'Рейтинги моҳ ба анҷом расид. Дар ин ҷо беҳтаринҳои моҳ нишон дода шудаанд.'
              : 'Дар ин ҷо донишҷӯёни беҳтарини марказ аз рӯи холҳои ҷамъкардаашон (XP) нишон дода мешаванд.'}
          </p>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Spinner size="lg" />
          </div>
        ) : topStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Globe size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Маълумот нест</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[60vh] custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50/95 dark:bg-[#0f172a]/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800/80 z-10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-20 text-center">Ҷой</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Донишҷӯ</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Ҳузур</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Хол (XP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {topStudents.map((student, index) => {
                    const rank = index + 1;
                    const isTop3 = rank <= 3;
                    
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
                              rank === 1 ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' :
                              rank === 2 ? 'bg-indigo-500 text-white border-indigo-600' :
                              rank === 3 ? 'bg-indigo-400 text-white border-indigo-500' :
                              'bg-slate-100 dark:bg-[#020617] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}>
                              {rank}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`hidden sm:flex w-9 h-9 rounded-full items-center justify-center text-sm font-bold flex-shrink-0 ${
                              isTop3 
                                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' 
                                : 'bg-slate-100 dark:bg-[#020617] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                            }`}>
                              {getInitials(student.name)}
                            </div>
                            <div className="min-w-0">
                              <p className={`font-bold text-sm truncate ${isTop3 ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-white'}`}>
                                {student.name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {student.groupName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400" title="Ҳозир">
                              <Check size={14} className="text-emerald-500" /> {student.present}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400" title="Масъалаҳо">
                              <BookOpen size={14} className="text-purple-500" /> {student.hwSolved}
                            </span>
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
        )}
      </div>
    </Modal>
  );
}
