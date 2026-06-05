"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, CheckCircle2, ShieldAlert, RefreshCw } from "lucide-react";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import toast from "react-hot-toast";

export default function WelcomePage() {
  const { user, logout, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!user.isEmailVerified) router.replace("/register?step=verify");
    else if (user.role === "MENTOR" || user.role === "TEACHER") router.replace("/client");
    else if (user.role === "ADMIN") router.replace("/admin");
  }, [user, loading, router]);

  async function handleCheckStatus() {
    setChecking(true);
    try {
      await refreshUser();
    } catch {
      toast.error("Хатогӣ рӯй дод");
    } finally {
      setChecking(false);
    }
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  if (loading || !user || user.role !== "USER") return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020617] p-4 font-sans text-slate-900 dark:text-slate-300">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-xl text-center z-10">
        {/* Animated shield/check icon */}
        <div className="relative inline-flex mb-8">
          <div className="w-24 h-24 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
            <CheckCircle2 size={40} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          {/* Subtle pulse */}
          <span className="absolute inset-0 rounded-2xl border-2 border-indigo-300 dark:border-indigo-700 animate-ping opacity-20" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
          Хуш омадед, {user.firstName}!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mb-10 leading-relaxed max-w-md mx-auto">
          Ҳисоби шумо дар система бомуваффақият фаъол шуд. Шумо ҳоло ҳамчун истифодабарандаи оддӣ ҳастед.
        </p>

        {/* Info card */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 sm:p-8 mb-8 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-5 pointer-events-none">
            <ShieldAlert size={120} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Дастрасӣ маҳдуд аст</h3>
                <p className="text-xs text-slate-500">Системаи CRM</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Барои ворид шудан ба панели <b>Ментор</b> ё <b>Муаллим</b>, лутфан ба администратори маркази таълимӣ муроҷиат кунед, то ки нақши шуморо тағйир диҳад. 
              То он вақт, шумо маълумоти гурӯҳҳоро дида наметавонед.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCheckStatus}
                disabled={checking}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <RefreshCw size={16} className={checking ? "animate-spin" : ""} />
                {checking ? "Санҷида истодааст..." : "Навсозии статус"}
              </button>
              <button
                onClick={handleLogout}
                className="flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm font-bold transition-colors"
              >
                <LogOut size={16} /> Баромад
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 opacity-50">
          <Logo size={20} className="grayscale" />
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wide uppercase">Hozir CRM</span>
        </div>
      </div>
    </div>
  );
}
