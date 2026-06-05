"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Search, AlertCircle } from "lucide-react";
import Logo from "@/components/ui/Logo";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-2xl text-center flex flex-col items-center">
        {/* Animated 404 Text */}
        <div className="relative mb-8">
          <h1 className="text-[8rem] sm:text-[12rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-linear-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-500 opacity-90">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 sm:w-48 sm:h-48 bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-full flex items-center justify-center shadow-2xl transform rotate-12 animate-pulse">
              <AlertCircle size={64} className="text-indigo-600 dark:text-indigo-400 opacity-80 sm:w-24 sm:h-24" />
            </div>
          </div>
        </div>

        {/* Content */}
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Саҳифа ёфт нашуд
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mx-auto mb-10 leading-relaxed">
          Бубахшед, саҳифае ки шумо меҷӯед вуҷуд надорад, ё кӯчонида шудааст. Лутфан суроғаро тафтиш кунед.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-2xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
            Ба қафо баргаштан
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-indigo-600/20"
          >
            <Home size={18} />
            Саҳифаи Асосӣ
          </Link>
        </div>

        {/* Footer Brand */}
        <div className="mt-20 flex items-center gap-3 opacity-60">
          <Logo size={24} className="grayscale" />
          <span className="text-sm font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Hozir CRM</span>
        </div>
      </div>
    </div>
  );
}
