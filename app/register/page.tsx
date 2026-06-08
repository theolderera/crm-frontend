"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Logo from "@/components/ui/Logo";
import Link from "next/link";

function RegisterForm() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user: authUser } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<"register" | "verify">(() =>
    searchParams.get("step") === "verify" ? "verify" : "register"
  );
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    if (authUser?.isEmailVerified) {
      router.replace("/welcome");
    }
  }, [authUser, router]);

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error(t("auth.pass_mismatch"));
      return;
    }
    setLoading(true);
    try {
      const finalPhone = !form.phone.startsWith("+992") ? `+992${form.phone}` : form.phone;
      const payload: {
        firstName: string;
        lastName?: string;
        email: string;
        phone: string;
        password: string;
      } = {
        firstName: form.firstName,
        email: form.email,
        phone: finalPhone,
        password: form.password,
      };
      if (form.lastName.trim()) payload.lastName = form.lastName.trim();

      const { token } = await authApi.register(payload);
      localStorage.setItem("crm_token", token);
      toast.success(t("auth.code_sent"));
      setStep("verify");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const msg = error?.response?.data?.message || t("auth.error_occurred");
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      toast.error(t("auth.code_length"));
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyEmail(verificationCode);
      toast.success(t("auth.email_verified"));
      const user = await authApi.me();
      login(localStorage.getItem("crm_token") || "", user);
      router.replace("/welcome");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const msg = error?.response?.data?.message || t("auth.invalid_code");
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4 py-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo size={72} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {step === "register" ? t("auth.register") : t("auth.verify_email")}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">
            {step === "register"
              ? t("auth.create_account_desc")
              : t("auth.verify_desc", { email: form.email })}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-gray-100 dark:shadow-slate-900/50 border border-gray-100 dark:border-slate-800 p-6 sm:p-8">
          {step === "register" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    {t("auth.first_name")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={set("firstName")}
                      placeholder="Said"
                      required
                      autoComplete="given-name"
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    {t("auth.last_name")}
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={set("lastName")}
                    placeholder="Saidov"
                    autoComplete="family-name"
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  {t("auth.email")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="example@mail.com"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  {t("auth.phone")} <span className="text-red-500">*</span>
                </label>
                <div className="flex w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition">
                  <div className="flex items-center justify-center px-3.5 bg-gray-100/50 dark:bg-slate-800/80 border-r border-gray-200 dark:border-slate-700">
                    <Phone size={15} className="text-gray-400 dark:text-slate-500 mr-1.5" />
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">+992</span>
                  </div>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                    placeholder="XX XXX XXXX"
                    required
                    autoComplete="tel"
                    className="flex-1 w-full px-4 py-2.5 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  {t("auth.password")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    placeholder="Ҳадди аққал 6 аломат"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-11 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  {t("auth.confirm_password")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={set("confirmPassword")}
                    placeholder={t("auth.confirm_password_placeholder")}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
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
                  <UserPlus size={17} />
                )}
                {loading ? t("auth.verifying") : t("auth.register")}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck size={32} />
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400 text-center mb-6">
                  {t("auth.verify_desc", { email: form.email })}
                </p>

                <div className="w-full">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    autoComplete="one-time-code"
                    className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 border border-gray-200 dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{t("auth.verify_button")}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep("register")}
                className="w-full text-center text-sm text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                {t("common.back")}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-5">
          {t("auth.have_account")}{" "}
          <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            {t("auth.login_button")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}