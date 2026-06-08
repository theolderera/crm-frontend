"use client";

import React from "react";
import { Menu, RefreshCw, Users, BookOpen } from "lucide-react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useTranslation } from "@/contexts/LanguageContext";

interface ClientHeaderProps {
  onMobileMenuOpen: () => void;
  totalGroups: number;
  totalStudents: number;
  loading: boolean;
  onRefresh: () => void;
}

export default function ClientHeader({
  onMobileMenuOpen,
  totalGroups,
  totalStudents,
  loading,
  onRefresh,
}: ClientHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="h-16 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800/60 sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8 font-sans">
      {/* Mobile Menu Button */}
      <div className="flex items-center gap-2 md:hidden">
        <button 
          onClick={onMobileMenuOpen}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <Menu size={20} />
        </button>
        <span className="font-bold text-slate-900 dark:text-white">Hozir CRM</span>
      </div>

      <div className="hidden md:block flex-1" />

      {/* Right Actions / Stats */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Stats - desktop only */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700">
          <span className="flex items-center gap-1.5">
            <Users size={14} className="text-indigo-500 dark:text-indigo-400" />
            <strong className="text-slate-900 dark:text-slate-200">{totalGroups}</strong> {t("dashboard.groups").toLowerCase()}
          </span>
          <span className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
          <span className="flex items-center gap-1.5">
            <BookOpen size={14} className="text-emerald-500 dark:text-emerald-400" />
            <strong className="text-slate-900 dark:text-slate-200">{totalStudents}</strong> {t("dashboard.students").toLowerCase()}
          </span>
        </div>

        <LanguageSwitcher />

        <button 
          onClick={onRefresh}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          title="Навсозӣ"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
    </header>
  );
}
