"use client";

import React from "react";
import { Search, Bell, Menu, RefreshCw } from "lucide-react";

interface AdminHeaderProps {
  search: string;
  onSearchChange: (val: string) => void;
  pendingCount: number;
  loading: boolean;
  onRefresh: () => void;
  onMobileMenuOpen: () => void;
}

export default function AdminHeader({
  search,
  onSearchChange,
  pendingCount,
  loading,
  onRefresh,
  onMobileMenuOpen,
}: AdminHeaderProps) {
  return (
    <header className="h-16 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800/60 sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8">
      {/* Mobile Menu Button */}
      <div className="flex items-center gap-2 md:hidden">
        <button 
          onClick={onMobileMenuOpen}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <Menu size={20} />
        </button>
        <span className="font-bold text-slate-900 dark:text-white">Admin</span>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-md ml-4 md:ml-0">
        <div className="relative group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Ҷустуҷӯ..."
            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 text-slate-900 dark:text-white text-sm rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 sm:gap-4 ml-4">
        <button 
          onClick={onRefresh}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors hidden sm:block"
          title="Навсозӣ"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
        <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <Bell size={20} />
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#020617]" />
          )}
        </button>
      </div>
    </header>
  );
}
