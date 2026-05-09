"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi } from "@/lib/api";
import { AuthUser, Group, Student } from "@/types";
import toast from "react-hot-toast";
import {
  LogOut,
  Users,
  ShieldCheck,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Trash2,
  ChevronRight,
  BookOpen,
  UserCircle,
  Settings,
  GraduationCap,
} from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Logo from "@/components/ui/Logo";
import Spinner from "@/components/ui/Spinner";

function AdminContent() {
  const { user: currentUser, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"users" | "groups" | "students">("users");

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [groups, setGroups] = useState<(Group & { mentor?: AuthUser })[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [changingRole, setChangingRole] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) router.replace("/login");
    else if (currentUser.role !== "ADMIN") router.replace("/pending");
  }, [currentUser, authLoading, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "users") {
        const data = await usersApi.getAll();
        setUsers(data);
      } else if (activeTab === "groups") {
        const data = await usersApi.getAllGroups();
        setGroups(data);
      } else if (activeTab === "students") {
        const data = await usersApi.getAllStudents();
        setStudents(data);
      }
    } catch {
      toast.error("Маълумот бор нашуд");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (currentUser?.role === "ADMIN") loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, activeTab]);

  async function handleRoleChange(userId: number, newRole: string) {
    if (userId === currentUser?.id) {
      toast.error("Роли худро тағйир дода наметавонед");
      return;
    }
    setChangingRole(userId);
    try {
      const updated = await usersApi.updateRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)));
      toast.success("Рол тағйир ёфт");
    } catch {
      toast.error("Хатогӣ ҳангоми тағйир додан");
    } finally {
      setChangingRole(null);
    }
  }

  async function handleDeleteUser(id: number) {
    if (id === currentUser?.id) {
      toast.error("Шумо худро нест карда наметавонед");
      return;
    }
    if (!confirm("Оё шумо мутмаин ҳастед? Ҳама маълумоти ин корбар нест мешавад.")) return;
    setDeletingId(id);
    try {
      await usersApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("Корбар нест карда шуд");
    } catch {
      toast.error("Хатогӣ");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteGroup(id: number) {
    if (!confirm("Гурӯҳро нест мекунед?")) return;
    try {
      await usersApi.deleteGroup(id);
      setGroups((prev) => prev.filter((g) => g.id !== id));
      toast.success("Гурӯҳ нест шуд");
    } catch {
      toast.error("Хатогӣ");
    }
  }

  async function handleDeleteStudent(id: number) {
    if (!confirm("Донишҷӯро нест мекунед?")) return;
    try {
      await usersApi.deleteStudent(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
      toast.success("Донишҷӯ нест шуд");
    } catch {
      toast.error("Хатогӣ");
    }
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.firstName.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q);
  });

  const filteredGroups = groups.filter((g) => {
    const q = search.toLowerCase();
    return !q || g.name.toLowerCase().includes(q) || g.mentor?.firstName.toLowerCase().includes(q);
  });

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.firstName.toLowerCase().includes(q) || s.lastName?.toLowerCase().includes(q);
  });

  const tabs = [
    { id: "users",    label: "Корбарон",   icon: Users },
    { id: "groups",   label: "Гурӯҳҳо",    icon: BookOpen },
    { id: "students", label: "Донишҷӯён",  icon: GraduationCap },
  ] as const;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950">
      {/* ─── Header ─── */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-indigo-900/50 flex-shrink-0 overflow-hidden">
              <Logo size={24} variant="inverted" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-slate-50 leading-none">Super Admin</h1>
              <p className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500 leading-none mt-0.5 hidden sm:block">Системаи пурраи идоракунӣ</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-3 py-1.5 border border-indigo-100 dark:border-indigo-800">
              <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                {currentUser?.firstName} {currentUser?.lastName}
              </span>
            </div>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200 rounded-xl transition-colors border border-gray-200 dark:border-slate-700"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Баромад</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">

        {/* ── Mobile tab bar ── */}
        <div className="flex gap-1.5 md:hidden bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch(""); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/40"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
              }`}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Desktop layout ── */}
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearch(""); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40"
                      : "text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon size={18} />
                    <span className="font-medium">{tab.label}</span>
                  </div>
                  {activeTab === tab.id && <ChevronRight size={14} />}
                </button>
              ))}
            </nav>

            <div className="mt-6 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <Settings size={14} className="text-gray-400" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Маълумот</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Корбарон</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{users.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Гурӯҳҳо</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{groups.length}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 flex flex-col gap-4">
            {/* Search bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-3 sm:p-4 flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ҷустуҷӯ..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <button
                onClick={loadData}
                title="Навсозӣ"
                className="p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Data panel */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Spinner size="lg" />
                </div>
              ) : (
                <>
                  {/* ─ USERS ─ */}
                  {activeTab === "users" && (
                    <>
                      {/* Mobile cards */}
                      <div className="sm:hidden divide-y divide-gray-50 dark:divide-slate-800">
                        {filteredUsers.length === 0 ? (
                          <p className="text-center text-sm text-gray-400 py-12">Корбар ёфт нашуд</p>
                        ) : filteredUsers.map((u) => (
                          <div key={u.id} className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
                              {u.firstName[0]}{u.lastName?.[0] || ""}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{u.firstName} {u.lastName}</p>
                              <p className="text-xs text-gray-400 truncate">{u.email}</p>
                              <p className="text-xs text-gray-400">{u.phone}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              {changingRole === u.id ? (
                                <Spinner size="sm" />
                              ) : (
                                <select
                                  value={u.role}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                  disabled={u.id === currentUser?.id}
                                  className="text-xs font-semibold px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white disabled:opacity-50"
                                >
                                  <option value="PENDING">Дар интизор</option>
                                  <option value="MENTOR">Ментор</option>
                                  <option value="ADMIN">Админ</option>
                                </select>
                              )}
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={u.id === currentUser?.id || deletingId === u.id}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Desktop table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-50 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                              <th className="text-left text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-6 py-4">Корбар</th>
                              <th className="text-left text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-6 py-4">Рол</th>
                              <th className="text-left text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-6 py-4">Контакт</th>
                              <th className="text-right text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-6 py-4">Амал</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                            {filteredUsers.map((u) => (
                              <tr key={u.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                                      {u.firstName[0]}{u.lastName?.[0] || ""}
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-gray-900 dark:text-white">{u.firstName} {u.lastName}</p>
                                      <p className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  {changingRole === u.id ? <Spinner size="sm" /> : (
                                    <select
                                      value={u.role}
                                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                      disabled={u.id === currentUser?.id}
                                      className="text-xs font-semibold px-2 py-1 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                                    >
                                      <option value="PENDING">Дар интизор</option>
                                      <option value="MENTOR">Ментор</option>
                                      <option value="ADMIN">Админ</option>
                                    </select>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="space-y-1">
                                    <p className="text-xs flex items-center gap-1.5 text-gray-600 dark:text-slate-400"><Mail size={12} /> {u.email}</p>
                                    <p className="text-xs flex items-center gap-1.5 text-gray-600 dark:text-slate-400"><Phone size={12} /> {u.phone}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    disabled={u.id === currentUser?.id || deletingId === u.id}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-30"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* ─ GROUPS ─ */}
                  {activeTab === "groups" && (
                    <>
                      {/* Mobile cards */}
                      <div className="sm:hidden divide-y divide-gray-50 dark:divide-slate-800">
                        {filteredGroups.length === 0 ? (
                          <p className="text-center text-sm text-gray-400 py-12">Гурӯҳ ёфт нашуд</p>
                        ) : filteredGroups.map((g) => (
                          <div key={g.id} className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                              <BookOpen size={18} className="text-indigo-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{g.name}</p>
                              {g.mentor && (
                                <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                  <UserCircle size={12} /> {g.mentor.firstName} {g.mentor.lastName}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-0.5">{g.students?.length || 0} нафар</p>
                            </div>
                            <button
                              onClick={() => handleDeleteGroup(g.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                      {/* Desktop table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-50 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                              <th className="text-left text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-6 py-4">Гурӯҳ</th>
                              <th className="text-left text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-6 py-4">Ментор</th>
                              <th className="text-left text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-6 py-4">Донишҷӯён</th>
                              <th className="text-right text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-6 py-4">Амал</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                            {filteredGroups.map((g) => (
                              <tr key={g.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{g.name}</td>
                                <td className="px-6 py-4">
                                  {g.mentor ? (
                                    <div className="flex items-center gap-2">
                                      <UserCircle size={16} className="text-indigo-500" />
                                      <span className="text-sm">{g.mentor.firstName} {g.mentor.lastName}</span>
                                    </div>
                                  ) : <span className="text-gray-400 text-xs">Бе ментор</span>}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium">{g.students?.length || 0} нафар</td>
                                <td className="px-6 py-4 text-right">
                                  <button onClick={() => handleDeleteGroup(g.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                                    <Trash2 size={18} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* ─ STUDENTS ─ */}
                  {activeTab === "students" && (
                    <>
                      {/* Mobile cards */}
                      <div className="sm:hidden divide-y divide-gray-50 dark:divide-slate-800">
                        {filteredStudents.length === 0 ? (
                          <p className="text-center text-sm text-gray-400 py-12">Донишҷӯ ёфт нашуд</p>
                        ) : filteredStudents.map((s) => (
                          <div key={s.id} className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
                              {s.firstName[0]}{s.lastName?.[0] || ""}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{s.firstName} {s.lastName}</p>
                              <span className="inline-block px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-100 dark:border-indigo-800 mt-0.5">
                                {s.group?.name || "Бе гурӯҳ"}
                              </span>
                              {s.phone && <p className="text-xs text-gray-400 mt-0.5">{s.phone}</p>}
                            </div>
                            <button
                              onClick={() => handleDeleteStudent(s.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                      {/* Desktop table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-50 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                              <th className="text-left text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-6 py-4">Донишҷӯ</th>
                              <th className="text-left text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-6 py-4">Гурӯҳ</th>
                              <th className="text-left text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-6 py-4">Телефон</th>
                              <th className="text-right text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-6 py-4">Амал</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                            {filteredStudents.map((s) => (
                              <tr key={s.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{s.firstName} {s.lastName}</td>
                                <td className="px-6 py-4">
                                  <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-100 dark:border-indigo-800">
                                    {s.group?.name || "Бе гурӯҳ"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500">{s.phone || "-"}</td>
                                <td className="px-6 py-4 text-right">
                                  <button onClick={() => handleDeleteStudent(s.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                                    <Trash2 size={18} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Spinner size="lg" />
      </div>
    }>
      <AdminContent />
    </Suspense>
  );
}
