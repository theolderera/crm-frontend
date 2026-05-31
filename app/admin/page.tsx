"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
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
  GraduationCap,
  LayoutDashboard,
  UserCheck,
  Clock,
  Eye,
} from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Logo from "@/components/ui/Logo";
import Spinner from "@/components/ui/Spinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AdminGroupDetail from "@/components/admin/AdminGroupDetail";

type Tab = "dashboard" | "users" | "groups" | "students";
type AdminGroup = Group & { mentor?: AuthUser };

const ROLE_LABEL: Record<string, string> = {
  PENDING: "Дар интизор",
  MENTOR: "Ментор",
  TEACHER: "Муаллими Асосӣ",
  ADMIN: "Админ",
};

function AdminContent() {
  const { user: currentUser, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [changingRole, setChangingRole] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'user' | 'group' | 'student';
    id: number | null;
    message: string;
  }>({ isOpen: false, type: 'user', id: null, message: '' });

  /** Group currently opened in the detail / report view. */
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) router.replace("/login");
    else if (currentUser.role === "MENTOR" || currentUser.role === "TEACHER") router.replace("/client");
    else if (currentUser.role !== "ADMIN") router.replace("/pending");
  }, [currentUser, authLoading, router]);

  /** Loads users, groups and students together so every counter stays in sync. */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [u, g, s] = await Promise.all([
        usersApi.getAll(),
        usersApi.getAllGroups(),
        usersApi.getAllStudents(),
      ]);
      setUsers(u);
      setGroups(g);
      setStudents(s);
    } catch {
      toast.error("Маълумот бор нашуд");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === "ADMIN") loadData();
  }, [currentUser, loadData]);

  async function handleRoleChange(userId: number, newRole: string) {
    if (userId === currentUser?.id) {
      toast.error("Роли худро тағйир дода наметавонед");
      return;
    }
    setChangingRole(userId);
    try {
      const updated = await usersApi.updateRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)),
      );
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
    setConfirmModal({
      isOpen: true,
      type: 'user',
      id,
      message: "Оё шумо мутмаин ҳастед? Ҳама маълумоти ин корбар нест мешавад.",
    });
  }

  async function handleDeleteGroup(id: number) {
    setConfirmModal({
      isOpen: true,
      type: 'group',
      id,
      message: "Гурӯҳро нест мекунед? Донишҷӯён ва ҳузури онҳо низ нест мешавад.",
    });
  }

  async function handleDeleteStudent(id: number) {
    setConfirmModal({
      isOpen: true,
      type: 'student',
      id,
      message: "Донишҷӯро нест мекунед?",
    });
  }

  async function handleConfirmDelete() {
    const { type, id } = confirmModal;
    if (!id) return;

    setDeletingId(id);
    try {
      if (type === 'user') {
        await usersApi.deleteUser(id);
        setUsers((prev) => prev.filter((u) => u.id !== id));
        toast.success("Корбар нест карда шуд");
      } else if (type === 'group') {
        await usersApi.deleteGroup(id);
        setGroups((prev) => prev.filter((g) => g.id !== id));
        setStudents((prev) => prev.filter((s) => s.groupId !== id));
        if (selectedGroupId === id) setSelectedGroupId(null);
        toast.success("Гурӯҳ нест шуд");
      } else if (type === 'student') {
        await usersApi.deleteStudent(id);
        setStudents((prev) => prev.filter((s) => s.id !== id));
        toast.success("Донишҷӯ нест шуд");
      }
      setConfirmModal({ ...confirmModal, isOpen: false });
    } catch {
      toast.error("Хатогӣ ҳангоми несткунӣ");
    } finally {
      setDeletingId(null);
    }
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  /* ─── Derived data ─── */
  const stats = useMemo(
    () => ({
      total: users.length,
      mentors: users.filter((u) => u.role === "MENTOR").length,
      pending: users.filter((u) => u.role === "PENDING").length,
      admins: users.filter((u) => u.role === "ADMIN").length,
      groups: groups.length,
      students: students.length,
    }),
    [users, groups, students],
  );

  const pendingUsers = useMemo(
    () => users.filter((u) => u.role === "PENDING"),
    [users],
  );

  /** Number of groups owned by each mentor — shown next to mentors. */
  const groupsByMentor = useMemo(() => {
    const m = new Map<number, number>();
    groups.forEach((g) => {
      if (g.mentorId != null)
        m.set(g.mentorId, (m.get(g.mentorId) ?? 0) + 1);
    });
    return m;
  }, [groups]);

  const q = search.trim().toLowerCase();

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          !q ||
          u.firstName.toLowerCase().includes(q) ||
          u.lastName?.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q),
      ),
    [users, q],
  );

  const filteredGroups = useMemo(
    () =>
      groups.filter(
        (g) =>
          !q ||
          g.name.toLowerCase().includes(q) ||
          g.mentor?.firstName.toLowerCase().includes(q) ||
          g.mentor?.lastName?.toLowerCase().includes(q),
      ),
    [groups, q],
  );

  const filteredStudents = useMemo(
    () =>
      students.filter(
        (s) =>
          !q ||
          s.firstName.toLowerCase().includes(q) ||
          s.lastName?.toLowerCase().includes(q) ||
          s.group?.name.toLowerCase().includes(q) ||
          s.phone?.includes(q),
      ),
    [students, q],
  );

  const tabs = [
    { id: "dashboard", label: "Асосӣ", icon: LayoutDashboard },
    { id: "users", label: "Корбарон", icon: Users },
    { id: "groups", label: "Гурӯҳҳо", icon: BookOpen },
    { id: "students", label: "Донишҷӯён", icon: GraduationCap },
  ] as const;

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setSearch("");
    setSelectedGroupId(null);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="print-root min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950">
      {/* ─── Header ─── */}
      <header className="no-print bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-indigo-900/50 flex-shrink-0 overflow-hidden">
              <Logo size={24} variant="inverted" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-slate-50 leading-none">
                Super Admin
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500 leading-none mt-0.5 hidden sm:block">
                Системаи пурраи идоракунӣ
              </p>
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
        {selectedGroup ? (
          /* ═══ Group detail / report ═══ */
          <AdminGroupDetail
            group={selectedGroup}
            onBack={() => setSelectedGroupId(null)}
            onGroupUpdate={(g) => {
              setGroups(prev => prev.map(gr => gr.id === g.id ? {...gr, teacher: g.teacher, teacherId: g.teacherId, teacher2: g.teacher2, teacher2Id: g.teacher2Id} : gr));
            }}
          />
        ) : (
          <>
            {/* ── Mobile tab bar ── */}
            <div className="grid grid-cols-4 gap-1.5 md:hidden bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-[10px] font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/40"
                      : "text-gray-500 dark:text-slate-400"
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* ── Desktop layout ── */}
            <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
              {/* Sidebar */}
              <aside className="hidden md:block w-64 shrink-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => switchTab(tab.id)}
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
                    <LayoutDashboard size={14} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Хулоса
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    <SidebarStat label="Корбарон" value={stats.total} />
                    <SidebarStat label="Менторҳо" value={stats.mentors} />
                    <SidebarStat label="Гурӯҳҳо" value={stats.groups} />
                    <SidebarStat label="Донишҷӯён" value={stats.students} />
                    {stats.pending > 0 && (
                      <SidebarStat
                        label="Дар интизор"
                        value={stats.pending}
                        highlight
                      />
                    )}
                  </div>
                </div>
              </aside>

              {/* Main content */}
              <main className="flex-1 min-w-0 flex flex-col gap-4">
                {/* Search bar — hidden on the dashboard tab */}
                {activeTab !== "dashboard" && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-3 sm:p-4 flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none"
                      />
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
                )}

                {loading ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-center py-20">
                    <Spinner size="lg" />
                  </div>
                ) : activeTab === "dashboard" ? (
                  /* ═══ DASHBOARD ═══ */
                  <DashboardPanel
                    stats={stats}
                    pendingUsers={pendingUsers}
                    changingRole={changingRole}
                    onApprove={(id) => handleRoleChange(id, "MENTOR")}
                    onGoTab={switchTab}
                    onRefresh={loadData}
                  />
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    {/* ═══ USERS ═══ */}
                    {activeTab === "users" && (
                      <UsersPanel
                        users={filteredUsers}
                        currentUserId={currentUser?.id}
                        changingRole={changingRole}
                        deletingId={deletingId}
                        groupsByMentor={groupsByMentor}
                        onRoleChange={handleRoleChange}
                        onDelete={handleDeleteUser}
                      />
                    )}

                    {/* ═══ GROUPS ═══ */}
                    {activeTab === "groups" && (
                      <GroupsPanel
                        groups={filteredGroups}
                        deletingId={deletingId}
                        onOpen={(id) => setSelectedGroupId(id)}
                        onDelete={handleDeleteGroup}
                      />
                    )}

                    {/* ═══ STUDENTS ═══ */}
                    {activeTab === "students" && (
                      <StudentsPanel
                        students={filteredStudents}
                        deletingId={deletingId}
                        onDelete={handleDeleteStudent}
                      />
                    )}
                  </div>
                )}
              </main>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="Тасдиқи ҳазф"
        message={confirmModal.message}
        loading={deletingId !== null}
      />
    </div>
  );
}

/* ─────────────────────────  Sub-components  ───────────────────────── */

function SidebarStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500 dark:text-slate-400">{label}</span>
      <span
        className={`text-sm font-bold ${
          highlight
            ? "text-amber-600 dark:text-amber-400"
            : "text-gray-900 dark:text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

interface Stats {
  total: number;
  mentors: number;
  pending: number;
  admins: number;
  groups: number;
  students: number;
}

function DashboardPanel({
  stats,
  pendingUsers,
  changingRole,
  onApprove,
  onGoTab,
  onRefresh,
}: {
  stats: Stats;
  pendingUsers: AuthUser[];
  changingRole: number | null;
  onApprove: (id: number) => void;
  onGoTab: (tab: Tab) => void;
  onRefresh: () => void;
}) {
  const cards = [
    { label: "Ҳамаи корбарон", value: stats.total, icon: Users, tab: "users" as Tab, accent: "text-indigo-500", ring: "bg-indigo-50 dark:bg-indigo-900/30" },
    { label: "Менторҳо", value: stats.mentors, icon: UserCheck, tab: "users" as Tab, accent: "text-emerald-500", ring: "bg-emerald-50 dark:bg-emerald-900/30" },
    { label: "Дар интизор", value: stats.pending, icon: Clock, tab: "users" as Tab, accent: "text-amber-500", ring: "bg-amber-50 dark:bg-amber-900/30" },
    { label: "Админҳо", value: stats.admins, icon: ShieldCheck, tab: "users" as Tab, accent: "text-rose-500", ring: "bg-rose-50 dark:bg-rose-900/30" },
    { label: "Гурӯҳҳо", value: stats.groups, icon: BookOpen, tab: "groups" as Tab, accent: "text-blue-500", ring: "bg-blue-50 dark:bg-blue-900/30" },
    { label: "Донишҷӯён", value: stats.students, icon: GraduationCap, tab: "students" as Tab, accent: "text-violet-500", ring: "bg-violet-50 dark:bg-violet-900/30" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={() => onGoTab(c.tab)}
            className="group text-left bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.ring}`}
              >
                <c.icon size={18} className={c.accent} />
              </div>
              <ChevronRight
                size={16}
                className="text-gray-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors"
              />
            </div>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-3 leading-none">
              {c.value}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">
              {c.label}
            </p>
          </button>
        ))}
      </div>

      {/* Pending approvals */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-gray-50 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Корбарони нав дар интизор
            </h2>
            {pendingUsers.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </div>
          <button
            onClick={onRefresh}
            title="Навсозӣ"
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {pendingUsers.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">
            Ҳама корбарон тасдиқ шудаанд ✓
          </p>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {pendingUsers.map((u) => (
              <div key={u.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold text-sm shrink-0">
                  {u.firstName[0]}
                  {u.lastName?.[0] || ""}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <button
                  onClick={() => onApprove(u.id)}
                  disabled={changingRole === u.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                >
                  {changingRole === u.id ? (
                    <Spinner size="sm" />
                  ) : (
                    <UserCheck size={14} />
                  )}
                  <span>Тасдиқ</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RoleSelect({
  user,
  currentUserId,
  changing,
  onChange,
}: {
  user: AuthUser;
  currentUserId?: number;
  changing: boolean;
  onChange: (id: number, role: string) => void;
}) {
  if (changing) return <Spinner size="sm" />;
  return (
    <select
      value={user.role}
      onChange={(e) => onChange(user.id, e.target.value)}
      disabled={user.id === currentUserId}
      className="text-xs font-semibold px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white disabled:opacity-50"
    >
      <option value="PENDING">{ROLE_LABEL.PENDING}</option>
      <option value="MENTOR">{ROLE_LABEL.MENTOR}</option>
      <option value="TEACHER">{ROLE_LABEL.TEACHER}</option>
      <option value="ADMIN">{ROLE_LABEL.ADMIN}</option>
    </select>
  );
}

function UsersPanel({
  users,
  currentUserId,
  changingRole,
  deletingId,
  groupsByMentor,
  onRoleChange,
  onDelete,
}: {
  users: AuthUser[];
  currentUserId?: number;
  changingRole: number | null;
  deletingId: number | null;
  groupsByMentor: Map<number, number>;
  onRoleChange: (id: number, role: string) => void;
  onDelete: (id: number) => void;
}) {
  if (users.length === 0)
    return <p className="text-center text-sm text-gray-400 py-12">Корбар ёфт нашуд</p>;

  return (
    <>
      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-gray-50 dark:divide-slate-800">
        {users.map((u) => (
          <div key={u.id} className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
              {u.firstName[0]}
              {u.lastName?.[0] || ""}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {u.firstName} {u.lastName}
              </p>
              <p className="text-xs text-gray-400 truncate">{u.email}</p>
              <p className="text-xs text-gray-400">{u.phone}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <RoleSelect
                user={u}
                currentUserId={currentUserId}
                changing={changingRole === u.id}
                onChange={onRoleChange}
              />
              <button
                onClick={() => onDelete(u.id)}
                disabled={u.id === currentUserId || deletingId === u.id}
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
            {users.map((u) => {
              const gCount = groupsByMentor.get(u.id) ?? 0;
              return (
                <tr
                  key={u.id}
                  className="hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                        {u.firstName[0]}
                        {u.lastName?.[0] || ""}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                          {u.role === "MENTOR" && ` · ${gCount} гурӯҳ`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RoleSelect
                      user={u}
                      currentUserId={currentUserId}
                      changing={changingRole === u.id}
                      onChange={onRoleChange}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-xs flex items-center gap-1.5 text-gray-600 dark:text-slate-400">
                        <Mail size={12} /> {u.email}
                      </p>
                      <p className="text-xs flex items-center gap-1.5 text-gray-600 dark:text-slate-400">
                        <Phone size={12} /> {u.phone}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onDelete(u.id)}
                      disabled={u.id === currentUserId || deletingId === u.id}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-30"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function GroupsPanel({
  groups,
  deletingId,
  onOpen,
  onDelete,
}: {
  groups: AdminGroup[];
  deletingId: number | null;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  if (groups.length === 0)
    return <p className="text-center text-sm text-gray-400 py-12">Гурӯҳ ёфт нашуд</p>;

  const mentorName = (g: AdminGroup) =>
    g.mentor
      ? [g.mentor.firstName, g.mentor.lastName].filter(Boolean).join(" ")
      : null;

  return (
    <>
      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-gray-50 dark:divide-slate-800">
        {groups.map((g) => (
          <div
            key={g.id}
            onClick={() => onOpen(g.id)}
            className="p-4 flex items-center gap-3 active:bg-gray-50 dark:active:bg-slate-800/40 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
              <BookOpen size={18} className="text-indigo-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {g.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <UserCircle size={12} /> {mentorName(g) ?? "Бе ментор"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {g.students?.length || 0} донишҷӯ
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(g.id);
              }}
              disabled={deletingId === g.id}
              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30"
            >
              <Trash2 size={15} />
            </button>
            <ChevronRight size={16} className="text-gray-300 dark:text-slate-600" />
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
            {groups.map((g) => (
              <tr
                key={g.id}
                onClick={() => onOpen(g.id)}
                className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                      <BookOpen size={15} className="text-indigo-500" />
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {g.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {mentorName(g) ? (
                    <div className="flex items-center gap-2">
                      <UserCircle size={16} className="text-indigo-500" />
                      <span className="text-sm">{mentorName(g)}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Бе ментор</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  {g.students?.length || 0} донишҷӯ
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(g.id);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                    >
                      <Eye size={14} />
                      <span>Кушодан</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(g.id);
                      }}
                      disabled={deletingId === g.id}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-30"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function StudentsPanel({
  students,
  deletingId,
  onDelete,
}: {
  students: Student[];
  deletingId: number | null;
  onDelete: (id: number) => void;
}) {
  if (students.length === 0)
    return <p className="text-center text-sm text-gray-400 py-12">Донишҷӯ ёфт нашуд</p>;

  return (
    <>
      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-gray-50 dark:divide-slate-800">
        {students.map((s) => (
          <div key={s.id} className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
              {s.firstName[0]}
              {s.lastName?.[0] || ""}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {s.firstName} {s.lastName}
              </p>
              <span className="inline-block px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-100 dark:border-indigo-800 mt-0.5">
                {s.group?.name || "Бе гурӯҳ"}
              </span>
              {s.phone && <p className="text-xs text-gray-400 mt-0.5">{s.phone}</p>}
            </div>
            <button
              onClick={() => onDelete(s.id)}
              disabled={deletingId === s.id}
              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30"
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
            {students.map((s) => (
              <tr
                key={s.id}
                className="hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                  {s.firstName} {s.lastName}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-100 dark:border-indigo-800">
                    {s.group?.name || "Бе гурӯҳ"}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">{s.phone || "—"}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onDelete(s.id)}
                    disabled={deletingId === s.id}
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
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
          <Spinner size="lg" />
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
