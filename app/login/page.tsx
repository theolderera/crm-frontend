"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Phone, Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Logo from "@/components/ui/Logo";
import Link from "next/link";

type LoginMode = "phone" | "email";

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const finalPhone = mode === "phone" && !phone.startsWith("+992") ? `+992${phone}` : phone;
      const creds = mode === "phone" ? { phone: finalPhone, password } : { email, password };
      const { token, user } = await authApi.login(creds);
      login(token, user);
      toast.success(`Хуш омадед, ${user.firstName}!`);
      if (user.role === "ADMIN") router.replace("/admin");
      else if (user.role === "MENTOR" || user.role === "TEACHER") router.replace("/client");
      else router.replace("/pending");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const msg = error?.response?.data?.message || "Хатогӣ рӯй дод";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo size={72} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student CRM</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">Ба системаи худ дохил шавед</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-gray-100 dark:shadow-slate-900/50 border border-gray-100 dark:border-slate-800 p-6 sm:p-8">
          {/* Mode tabs */}
          <div className="flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode("phone")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${mode === "phone"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                }`}
            >
              <Phone size={15} /> Телефон
            </button>
            <button
              type="button"
              onClick={() => setMode("email")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${mode === "email"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                }`}
            >
              <Mail size={15} /> Имейл
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "phone" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Рақами телефон
                </label>
                <div className="flex w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition">
                  <div className="flex items-center justify-center px-3.5 bg-gray-100/50 dark:bg-slate-800/80 border-r border-gray-200 dark:border-slate-700">
                    <Phone size={16} className="text-gray-400 dark:text-slate-500 mr-1.5" />
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">+992</span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="XX XXX XXXX"
                    required
                    autoComplete="tel"
                    className="flex-1 w-full px-4 py-3 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Имейл
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Парол
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Паролро ворид кунед"
                  required
                  minLength={6}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition p-0.5"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40 mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={17} />
              )}
              {loading ? "Дохил шуда истодааст..." : "Дохил шавед"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-5">
          Ҳисоб надоред?{" "}
          <Link href="/register" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            Қайд шавед
          </Link>
        </p>
      </div>
    </div>
  );
}
