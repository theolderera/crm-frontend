"use client";

import React, { useState, useEffect } from "react";
import { reportsApi } from "@/lib/api";
import Spinner from "@/components/ui/Spinner";
import Modal from "@/components/ui/Modal";
import { Trophy, Medal, Award, Check, Clock, Info, BookOpen, Star, Globe, TrendingUp, Users, Crown } from "lucide-react";
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
    <Modal isOpen={isOpen} onClose={onClose} title={leaderboardState?.label || "Рейтинги Умумии Марказ"} size="lg">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
            {isSummary ? <Crown size={20} className="text-amber-500" /> : <TrendingUp size={20} />}
          </div>
          <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
            {isSummary 
              ? 'Рейтинги ин моҳ ба анҷом расид! Дар ин ҷо 5 ғолиби беҳтарини моҳ аз тамоми марказ нишон дода шудааст. Мо ба ҳамаи ғолибон аҳсан мегӯем!'
              : 'Дар ин ҷо 50 донишҷӯи беҳтарини марказ аз рӯи холҳои ҷамъкардаашон (XP) нишон дода мешаванд. Холҳо аз рӯи давомоти саривақтӣ ва масъалаҳои ҳалкарда ба даст меоянд.'}
          </p>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Spinner size="lg" className="text-indigo-500 mb-4" />
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 animate-pulse">
              Ҳисобкунии рейтинги умумӣ...
            </p>
          </div>
        ) : topStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] bg-slate-50/80 dark:bg-[#131B2F]/50 rounded-2xl">
            <Globe size={48} className="text-gray-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-700 dark:text-slate-300 mb-1">Маълумот нест</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Ҳанӯз ягон дарси сабтшуда вуҷуд надорад.</p>
          </div>
        ) : (
          <div className="flex flex-col overflow-y-auto max-h-[60vh] pr-1 custom-scrollbar pb-6 gap-8">
            
            {/* Podium for Top 3 */}
            {topStudents.length >= 3 && (
              <div className="flex items-end justify-center gap-2 sm:gap-6 pt-10 pb-4 px-2">
                {/* 2nd Place */}
                <div className="flex flex-col items-center relative w-1/3 max-w-[120px]">
                  <div className="absolute -top-10">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 shadow-lg shadow-slate-300/40 dark:shadow-black/40 flex items-center justify-center border-4 border-white dark:border-slate-900 z-10 relative">
                      <span className="text-slate-700 font-bold text-lg">{getInitials(topStudents[1].name)}</span>
                      <Medal size={16} className="absolute -bottom-2 text-slate-100 drop-shadow-md bg-slate-500 rounded-full p-0.5" />
                    </div>
                  </div>
                  <div className="w-full bg-gradient-to-t from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/80 rounded-t-2xl border border-b-0 border-slate-200 dark:border-slate-700 pt-8 pb-4 px-2 flex flex-col items-center shadow-inner h-32 justify-between">
                    <div className="text-center w-full">
                      <p className="font-bold text-xs sm:text-sm text-gray-800 dark:text-slate-200 truncate w-full px-1">{topStudents[1].name}</p>
                      <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-slate-400 truncate w-full px-1 mt-0.5">{topStudents[1].groupName}</p>
                    </div>
                    <div className="bg-slate-200 dark:bg-slate-700/80 px-2 sm:px-3 py-1 rounded-lg text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm flex items-center gap-1">
                      {topStudents[1].xp} <Star size={12} className="fill-current opacity-70" />
                    </div>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center relative w-1/3 max-w-[140px] z-10">
                  <div className="absolute -top-14">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-xl shadow-amber-300/40 dark:shadow-amber-900/40 flex items-center justify-center border-4 border-white dark:border-slate-900 z-10 relative">
                      <span className="text-white font-black text-2xl">{getInitials(topStudents[0].name)}</span>
                      <Trophy size={22} className="absolute -bottom-2 text-yellow-100 drop-shadow-lg bg-amber-600 rounded-full p-1" />
                    </div>
                  </div>
                  <div className="w-full bg-gradient-to-t from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/10 rounded-t-2xl border border-b-0 border-amber-200 dark:border-amber-800/50 pt-10 pb-4 px-2 flex flex-col items-center shadow-inner h-40 justify-between">
                    <div className="text-center w-full">
                      <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate w-full px-1">{topStudents[0].name}</p>
                      <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-400 truncate w-full px-1 mt-0.5">{topStudents[0].groupName}</p>
                    </div>
                    <div className="bg-amber-500 text-white px-3 sm:px-4 py-1.5 rounded-xl font-black text-sm sm:text-base flex items-center gap-1 shadow-md shadow-amber-500/20">
                      {topStudents[0].xp} <Star size={14} className="fill-current" />
                    </div>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center relative w-1/3 max-w-[120px]">
                  <div className="absolute -top-10">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-200 to-orange-400 shadow-lg shadow-orange-300/40 dark:shadow-black/40 flex items-center justify-center border-4 border-white dark:border-slate-900 z-10 relative">
                      <span className="text-orange-900 font-bold text-lg">{getInitials(topStudents[2].name)}</span>
                      <Award size={16} className="absolute -bottom-2 text-orange-100 drop-shadow-md bg-orange-600 rounded-full p-0.5" />
                    </div>
                  </div>
                  <div className="w-full bg-gradient-to-t from-orange-50 to-orange-50/30 dark:from-orange-900/20 dark:to-orange-900/5 rounded-t-2xl border border-b-0 border-orange-200 dark:border-orange-800/50 pt-8 pb-4 px-2 flex flex-col items-center shadow-inner h-28 justify-between">
                    <div className="text-center w-full">
                      <p className="font-bold text-xs sm:text-sm text-gray-800 dark:text-slate-200 truncate w-full px-1">{topStudents[2].name}</p>
                      <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-slate-400 truncate w-full px-1 mt-0.5">{topStudents[2].groupName}</p>
                    </div>
                    <div className="bg-orange-200 dark:bg-orange-900/60 px-2 sm:px-3 py-1 rounded-lg text-orange-800 dark:text-orange-300 font-bold text-xs sm:text-sm flex items-center gap-1">
                      {topStudents[2].xp} <Star size={12} className="fill-current opacity-70" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* List for rank 4 to 50 (or 4 to 5) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-2 px-2">
                <Users size={16} className="text-gray-400" />
                <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {isSummary ? 'Дигар Ғолибон' : 'Дигар донишҷӯён'}
                </h4>
              </div>
              
              <div className="bg-white/90 dark:bg-[#131B2F] rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-hidden shadow-lg shadow-slate-200/40 dark:shadow-black/20">
                <div className="grid grid-cols-[50px_1fr_90px] sm:grid-cols-[60px_1fr_120px_90px] gap-2 px-4 py-3 bg-slate-50/80 dark:bg-indigo-950/40 border-b border-slate-200/60 dark:border-white/5 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-indigo-200 uppercase tracking-wider">
                  <div className="text-center">Ҷой</div>
                  <div>Донишҷӯ</div>
                  <div className="hidden sm:block text-center">Омор</div>
                  <div className="text-right">Холҳо</div>
                </div>
                
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {topStudents.slice(3).map((student, index) => {
                    const rank = index + 4; // Because we sliced from 3
                    
                    return (
                      <div 
                        key={student.id} 
                        className={`grid grid-cols-[50px_1fr_90px] sm:grid-cols-[60px_1fr_120px_90px] gap-2 px-4 py-3 sm:py-3.5 items-center hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors ${
                          index % 2 === 0 ? "bg-transparent" : "bg-slate-50/30 dark:bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex justify-center">
                          <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 font-semibold text-xs flex items-center justify-center">
                            {rank}
                          </div>
                        </div>
                        
                        <div className="flex flex-col min-w-0">
                          <h4 className="font-semibold text-sm text-gray-800 dark:text-slate-200 truncate">
                            {student.name}
                          </h4>
                          <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate mt-0.5">
                            {student.groupName}
                          </p>
                        </div>
                        
                        <div className="hidden sm:flex items-center justify-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                          <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-300" title="Ҳузур">
                            <Check size={12} className="text-green-500" /> {student.present}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-300" title="Масъалаҳо">
                            <BookOpen size={12} className="text-purple-500" /> {student.hwSolved}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-end gap-1.5 font-bold text-gray-700 dark:text-slate-200 text-sm">
                          {student.xp}
                          <Star size={14} className="text-gray-300 dark:text-slate-600 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {topStudents.length === 3 && !isSummary && (
                  <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-slate-400">
                    Дигар донишҷӯён вуҷуд надоранд
                  </div>
                )}
              </div>
            </div>
            
          </div>
        )}
      </div>
    </Modal>
  );
}
