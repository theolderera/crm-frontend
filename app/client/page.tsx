"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Group, Student } from "@/types";
import { groupsApi, studentsApi } from "@/lib/api";
import {
  getWeekStart,
  getWeekDays,
  navigateWeek,
  formatDate,
} from "@/lib/dates";
import { formatStudentName, getStudentInitials } from "@/lib/formatters";
import GroupCard from "@/components/groups/GroupCard";
import GroupForm from "@/components/groups/GroupForm";
import StudentForm from "@/components/students/StudentForm";
import AttendanceGrid from "@/components/attendance/AttendanceGrid";
import WeekNavigator from "@/components/attendance/WeekNavigator";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Logo from "@/components/ui/Logo";
import Spinner from "@/components/ui/Spinner";
import AIChatWidget from "@/components/ai/AIChatWidget";
import toast from "react-hot-toast";
import {
  Plus,
  Users,
  BookOpen,
  UserPlus,
  Edit2,
  Trash2,
  LogOut,
} from "lucide-react";

export default function ClientPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [loading, setLoading] = useState(true);

  const [groupModal, setGroupModal] = useState<{ open: boolean; editing?: Group }>({ open: false });
  const [studentModal, setStudentModal] = useState<{ open: boolean; editing?: Student }>({ open: false });
  const [deleteGroup, setDeleteGroup] = useState<Group | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/login");
    else if (user.role === "PENDING") router.replace("/pending");
    else if (user.role === "ADMIN") router.replace("/admin");
  }, [user, authLoading, router]);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const isCurrentWeek = useMemo(
    () => formatDate(weekStart) === formatDate(getWeekStart(new Date())),
    [weekStart],
  );

  const loadGroups = useCallback(async () => {
    try {
      const data = await groupsApi.getAll();
      setGroups(data);
      if (data.length > 0) setSelectedGroup((prev) => prev ?? data[0]);
    } catch {
      toast.error("Гурӯҳҳо бор нашуданд");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    if (!selectedGroup) { setStudents([]); return; }
    try {
      const data = await studentsApi.getByGroup(selectedGroup.id);
      setStudents(data);
    } catch {
      toast.error("Талабагон бор нашуданд");
    }
  }, [selectedGroup]);

  useEffect(() => { if (user?.role === "MENTOR") loadGroups(); }, [loadGroups, user]);
  useEffect(() => { loadStudents(); }, [loadStudents]);

  const handleAIGroupCreated = useCallback((group: Group, students: Student[]) => {
    const groupWithStudents = { ...group, students };
    setGroups((prev) => [...prev, groupWithStudents]);
    setSelectedGroup(groupWithStudents);
    setStudents(students);
    toast.success(`"${group.name}" гурӯҳ бо ${students.length} талаба илова шуд`);
  }, []);

  const handleAIStudentsAdded = useCallback((groupId: number, newStudents: Student[]) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, students: [...(g.students || []), ...newStudents] } : g
      )
    );
    if (selectedGroup?.id === groupId) {
      setStudents((prev) => [...prev, ...newStudents]);
    }
    toast.success(`${newStudents.length} талаба илова шуд`);
  }, [selectedGroup]);

  const handleCreateGroup = async (data: { name: string; description?: string }) => {
    const group = await groupsApi.create(data);
    setGroups((prev) => [...prev, { ...group, students: [] }]);
    setSelectedGroup(group);
    setGroupModal({ open: false });
    toast.success(`"${group.name}" гурӯҳ илова шуд`);
  };

  const handleUpdateGroup = async (data: { name: string; description?: string }) => {
    if (!groupModal.editing) return;
    const updated = await groupsApi.update(groupModal.editing.id, data);
    setGroups((prev) => prev.map((g) => (g.id === updated.id ? { ...g, ...updated } : g)));
    if (selectedGroup?.id === updated.id)
      setSelectedGroup((prev) => (prev ? { ...prev, ...updated } : prev));
    setGroupModal({ open: false });
    toast.success("Гурӯҳ нав карда шуд");
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroup) return;
    setDeletingGroup(true);
    try {
      await groupsApi.delete(deleteGroup.id);
      const remaining = groups.filter((g) => g.id !== deleteGroup.id);
      setGroups(remaining);
      if (selectedGroup?.id === deleteGroup.id) setSelectedGroup(remaining[0] ?? null);
      setDeleteGroup(null);
      toast.success(`"${deleteGroup.name}" гурӯҳ ҳазф шуд`);
    } catch {
      toast.error("Хатогӣ ҳангоми ҳазф");
    } finally {
      setDeletingGroup(false);
    }
  };

  const handleCreateStudent = async (data: { firstName: string; lastName?: string | null; phone?: string | null; groupId: number }) => {
    const student = await studentsApi.create(data);
    setStudents((prev) => [...prev, student]);
    setGroups((prev) =>
      prev.map((g) =>
        g.id === data.groupId ? { ...g, students: [...(g.students || []), student] } : g,
      ),
    );
    setStudentModal({ open: false });
    toast.success(`${formatStudentName(student)} илова шуд`);
  };

  const handleUpdateStudent = async (data: { firstName: string; lastName?: string | null; phone?: string | null; groupId: number }) => {
    if (!studentModal.editing) return;
    const updated = await studentsApi.update(studentModal.editing.id, data);
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setStudentModal({ open: false });
    toast.success("Маълумот нав карда шуд");
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudent) return;
    setDeletingStudent(true);
    try {
      await studentsApi.delete(deleteStudent.id);
      setStudents((prev) => prev.filter((s) => s.id !== deleteStudent.id));
      setGroups((prev) =>
        prev.map((g) => ({ ...g, students: g.students?.filter((s) => s.id !== deleteStudent.id) || [] })),
      );
      toast.success(`${deleteStudent.firstName} ҳазф шуд`);
      setDeleteStudent(null);
    } catch {
      toast.error("Хатогӣ ҳангоми ҳазф");
    } finally {
      setDeletingStudent(false);
    }
  };

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const totalStudents = useMemo(
    () => groups.reduce((a, g) => a + (g.students?.length || 0), 0),
    [groups],
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 dark:text-slate-400">Бор шуда истодааст...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
      {/* ─── Header ─── */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40 shadow-sm dark:shadow-slate-900/50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Logo + title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-indigo-900/50 flex-shrink-0 overflow-hidden">
              <Logo size={24} variant="inverted" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-slate-50 leading-none">Student CRM</h1>
              <p className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500 leading-none mt-0.5 hidden sm:block">Системаи қайди ҳузур</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Stats - desktop only */}
            <div className="hidden md:flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-gray-100 dark:border-slate-700">
              <span className="flex items-center gap-1.5">
                <Users size={13} className="text-indigo-500 dark:text-indigo-400" />
                <strong className="text-gray-800 dark:text-slate-200">{groups.length}</strong> гурӯҳ
              </span>
              <span className="w-px h-3 bg-gray-300 dark:bg-slate-600" />
              <span className="flex items-center gap-1.5">
                <BookOpen size={13} className="text-green-500 dark:text-green-400" />
                <strong className="text-gray-800 dark:text-slate-200">{totalStudents}</strong> талаба
              </span>
            </div>

            {/* Mentor name - tablet+ */}
            <div className="hidden sm:flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-3 py-1.5 border border-indigo-100 dark:border-indigo-800">
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                {user?.firstName} {user?.lastName ?? ""}
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

      {/* ─── Body ─── */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">

        {/* ── Mobile group selector (< lg) ── */}
        <div className="lg:hidden mb-4">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Гурӯҳҳо</h2>
            <div className="flex items-center gap-1.5">
              {selectedGroup && (
                <>
                  <button
                    onClick={() => setGroupModal({ open: true, editing: selectedGroup })}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteGroup(selectedGroup)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
              <button
                onClick={() => setGroupModal({ open: true })}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
              >
                <Plus size={13} /> Нав
              </button>
            </div>
          </div>

          {groups.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-slate-500 py-2">Гурӯҳ нест — нав илова кунед</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                    selectedGroup?.id === group.id
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/40"
                      : "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 text-gray-700 dark:text-slate-300"
                  }`}
                >
                  <Users size={13} className={selectedGroup?.id === group.id ? "text-indigo-200" : "text-indigo-400"} />
                  <span>{group.name}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    selectedGroup?.id === group.id
                      ? "bg-indigo-500 text-indigo-100"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400"
                  }`}>
                    {group.students?.length ?? 0}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Desktop layout ── */}
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Гурӯҳҳо</h2>
              <button
                onClick={() => setGroupModal({ open: true })}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
              >
                <Plus size={13} /> Нав
              </button>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto pr-0.5" style={{ maxHeight: "calc(100vh - 160px)" }}>
              {groups.length === 0 ? (
                <EmptyState icon={Users} title="Гурӯҳ нест" description="Гурӯҳи аввалро илова кунед" />
              ) : (
                groups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    isActive={selectedGroup?.id === group.id}
                    onClick={() => setSelectedGroup(group)}
                    onEdit={() => setGroupModal({ open: true, editing: group })}
                    onDelete={() => setDeleteGroup(group)}
                  />
                ))
              )}
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 flex flex-col gap-4">
            {selectedGroup ? (
              <>
                {/* Group header card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-50 truncate">{selectedGroup.name}</h2>
                      {selectedGroup.description && (
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 truncate">{selectedGroup.description}</p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{students.length} талаба</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <WeekNavigator
                        weekStart={weekStart}
                        isCurrentWeek={isCurrentWeek}
                        onPrev={() => setWeekStart((w) => navigateWeek(w, "prev"))}
                        onNext={() => setWeekStart((w) => navigateWeek(w, "next"))}
                        onToday={() => setWeekStart(getWeekStart(new Date()))}
                      />
                      <button
                        onClick={() => setStudentModal({ open: true })}
                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40 whitespace-nowrap"
                      >
                        <UserPlus size={15} />
                        <span className="hidden sm:inline">Талаба илова</span>
                        <span className="sm:hidden">Илова</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Attendance grid */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Рӯйхати ҳузур</h3>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-lg font-medium border border-green-100 dark:border-green-800/50">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Ҳозир
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg font-medium">
                        <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-slate-600 rounded-full" /> Набуд
                      </span>
                    </div>
                  </div>
                  <div className="overflow-auto">
                    <AttendanceGrid students={students} weekDays={weekDays} groupId={selectedGroup.id} />
                  </div>

                  {/* Student management */}
                  {students.length > 0 && (
                    <div className="border-t border-gray-50 dark:border-slate-800 px-4 py-3">
                      <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                        Идоракунии талабагон
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {students.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 rounded-xl px-3 py-1.5 border border-gray-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-600 transition-colors group"
                          >
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300 flex-shrink-0">
                              {getStudentInitials(student)}
                            </div>
                            <span className="text-sm text-gray-700 dark:text-slate-300 font-medium">
                              {formatStudentName(student)}
                            </span>
                            {/* Always visible on mobile, hover on desktop */}
                            <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setStudentModal({ open: true, editing: student })}
                                className="p-1 text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded"
                                aria-label="Таҳрир"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => setDeleteStudent(student)}
                                className="p-1 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded"
                                aria-label="Ҳазф"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
                <EmptyState icon={BookOpen} title="Гурӯҳ интихоб нашудааст" description="Аз рӯйхати гурӯҳҳо интихоб кунед" />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ─── Modals ─── */}
      <Modal
        isOpen={groupModal.open}
        onClose={() => setGroupModal({ open: false })}
        title={groupModal.editing ? "Гурӯҳро тағйир додан" : "Гурӯҳи нав"}
      >
        <GroupForm
          initial={groupModal.editing}
          onSubmit={groupModal.editing ? handleUpdateGroup : handleCreateGroup}
          onCancel={() => setGroupModal({ open: false })}
        />
      </Modal>

      <Modal
        isOpen={studentModal.open}
        onClose={() => setStudentModal({ open: false })}
        title={studentModal.editing ? "Маълумотро тағйир додан" : "Талабаи нав"}
      >
        {selectedGroup && (
          <StudentForm
            initial={studentModal.editing}
            groupId={selectedGroup.id}
            onSubmit={studentModal.editing ? handleUpdateStudent : handleCreateStudent}
            onCancel={() => setStudentModal({ open: false })}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteGroup}
        onClose={() => setDeleteGroup(null)}
        onConfirm={handleDeleteGroup}
        title="Гурӯҳро ҳазф кардан"
        message={`Оё мутмаин ҳастед, ки гурӯҳи "${deleteGroup?.name}" ва ҳамаи талабагонашро ҳазф мекунед?`}
        loading={deletingGroup}
      />

      <ConfirmDialog
        isOpen={!!deleteStudent}
        onClose={() => setDeleteStudent(null)}
        onConfirm={handleDeleteStudent}
        title="Талабаро ҳазф кардан"
        message={`Оё мутмаин ҳастед, ки ${deleteStudent ? formatStudentName(deleteStudent) : ""}-ро ҳазф мекунед?`}
        loading={deletingStudent}
      />

      <AIChatWidget
        groups={groups}
        onGroupCreated={handleAIGroupCreated}
        onStudentsAdded={handleAIStudentsAdded}
      />
    </div>
  );
}
