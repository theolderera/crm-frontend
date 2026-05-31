"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, LogOut, Mail, Phone, CheckCircle, RefreshCw } from "lucide-react";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import toast from "react-hot-toast";

export default function PendingPage() {
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

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-amber-50 via-white to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/20 p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg text-center">
        {/* Animated waiting icon */}
        <div className="relative inline-flex mb-8">
          <div className="w-28 h-28 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-amber-200 dark:bg-amber-800/40 flex items-center justify-center">
              <Clock size={36} className="text-amber-600 dark:text-amber-400 animate-pulse" />
            </div>
          </div>
          <span className="absolute -top-1 -right-1 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center animate-bounce">
            <span className="text-white text-xs font-bold">!</span>
          </span>
          {/* Pulse rings */}
          <span className="absolute inset-0 rounded-full border-4 border-amber-300 dark:border-amber-700 animate-ping opacity-30" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Дар интизор монед
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-base mb-8 leading-relaxed max-w-sm mx-auto">
          Ҳисоби шумо бомуваффақият сохта шуд. Хоҳиш мекунем, то вақте ки
          администратор роли шуморо тасдиқ кунад, интизор шавед.
        </p>

        {/* User info card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-100 dark:shadow-slate-900/50 p-6 mb-8 text-left">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {user.firstName[0]?.toUpperCase()}
                {user.lastName?.[0]?.toUpperCase() ?? ""}
              </span>
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-lg">
                {user.firstName} {user.lastName ?? ""}
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                <Clock size={11} /> Дар интизор
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
              <Mail size={16} className="text-indigo-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500">Имейл</p>
                <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
              <Phone size={16} className="text-indigo-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500">Рақами телефон</p>
                <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{user.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-100 dark:shadow-slate-900/50 p-6 mb-8 text-left">
          <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Марҳилаҳо
          </p>
          <div className="space-y-3">
            {[
              { done: true, text: "Ҳисоб сохта шуд" },
              { done: false, text: "Администратор роли шуморо тасдиқ мекунад" },
              { done: false, text: "Ба системаи CRM дастрасӣ пайдо мекунед" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    step.done
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-gray-100 dark:bg-slate-800"
                  }`}
                >
                  {step.done ? (
                    <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-slate-600" />
                  )}
                </div>
                <p
                  className={`text-sm ${
                    step.done
                      ? "text-green-700 dark:text-green-400 font-medium"
                      : "text-gray-500 dark:text-slate-400"
                  }`}
                >
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40"
          >
            {checking ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <RefreshCw size={15} />
            )}
            {checking ? "Санҷида истодааст..." : "Статусро санҷед"}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors"
          >
            <LogOut size={15} /> Баромадан
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 opacity-40">
          <Logo size={20} />
          <span className="text-xs text-gray-400 dark:text-slate-500">Student CRM</span>
        </div>
      </div>
    </div>
  );
}
