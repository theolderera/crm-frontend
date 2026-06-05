"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Group, Student, CourseMonth } from "@/types";
import { groupsApi, studentsApi } from "@/lib/api";
import {
  getWeekStart,
  getWeekDays,
  navigateWeek,
  formatDate,
} from "@/lib/dates";
import { formatStudentName, getStudentInitials } from "@/lib/formatters";
import GroupForm from "@/components/groups/GroupForm";
import TeacherAssign from "@/components/groups/TeacherAssign";
import LeaderboardPanel from "@/components/groups/LeaderboardPanel";
import GlobalLeaderboardModal from "@/components/groups/GlobalLeaderboardModal";
import StudentForm from "@/components/students/StudentForm";
import AttendanceGrid from "@/components/attendance/AttendanceGrid";
import WeekNavigator from "@/components/attendance/WeekNavigator";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";
import AIChatWidget from "@/components/ai/AIChatWidget";
import toast from "react-hot-toast";
import {
  Users,
  BookOpen,
  UserPlus,
  Edit2,
  Trash2,
  FileText,
  Trophy,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Settings
} from "lucide-react";

import ClientSidebar from "@/components/client/ClientSidebar";
import ClientHeader from "@/components/client/ClientHeader";
import ClientSupportPage from "./support/page";
import ProfilePage from "./profile/page";

export default function ClientPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [months, setMonths] = useState<CourseMonth[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [loading, setLoading] = useState(true);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [groupModal, setGroupModal] = useState<{ open: boolean; editing?: Group; courseMonthId?: number }>({ open: false });
  const [studentModal, setStudentModal] = useState<{ open: boolean; editing?: Student }>({ open: false });
  const [deleteGroup, setDeleteGroup] = useState<Group | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState(false);
  const [groupTab, setGroupTab] = useState<'attendance' | 'leaderboard'>('attendance');
  const [globalLeaderboardOpen, setGlobalLeaderboardOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'groups' | 'support' | 'profile'>('groups');

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/login");
    else if (user.role === "USER") router.replace("/welcome");
    else if (user.role === "ADMIN") router.replace("/admin");
  }, [user, authLoading, router]);

  const isMentor = user?.role === "MENTOR";
  const isTeacher = user?.role === "TEACHER";

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const isCurrentWeek = useMemo(
    () => formatDate(weekStart) === formatDate(getWeekStart(new Date())),
    [weekStart],
  );

  const loadMonths = useCallback(async () => {
    try {
      const data = await groupsApi.getMonths();
      setMonths(data);
      if (data.length > 0 && data[0].groups.length > 0) {
        setSelectedGroup((prev) => prev ?? data[0].groups[0]);
      }
    } catch {
      toast.error("Давраҳои омӯзишӣ бор нашуданд");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateMonth = async () => {
    try {
      const month = await groupsApi.createMonth();
      setMonths((prev) => [month, ...prev]);
      toast.success(`Контейнери "${month.name}" сохта шуд`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Хатогӣ ҳангоми сохтани контейнер");
    }
  };

  const loadStudents = useCallback(async () => {
    if (!selectedGroup) { setStudents([]); return; }
    try {
      const data = await studentsApi.getByGroup(selectedGroup.id);
      setStudents(data);
    } catch {
      toast.error("Донишҷӯён бор нашуданд");
    }
  }, [selectedGroup]);

  useEffect(() => { if (user?.role === "MENTOR" || user?.role === "TEACHER") loadMonths(); }, [loadMonths, user]);
  useEffect(() => { loadStudents(); }, [loadStudents]);

  const handleAIGroupCreated = useCallback((group: Group, students: Student[]) => {
    const groupWithStudents = { ...group, students };
    setMonths((prev) =>
      prev.map((m) =>
        m.id === group.courseMonthId
          ? { ...m, groups: [...m.groups, groupWithStudents] }
          : m
      )
    );
    setSelectedGroup(groupWithStudents);
    setStudents(students);
    toast.success(`"${group.name}" гурӯҳ бо ${students.length} донишҷӯ илова шуд`);
  }, []);

  const handleAIStudentsAdded = useCallback((groupId: number, newStudents: Student[]) => {
    setMonths((prev) =>
      prev.map((m) => ({
        ...m,
        groups: m.groups.map((g) =>
          g.id === groupId ? { ...g, students: [...(g.students || []), ...newStudents] } : g
        )
      }))
    );
    if (selectedGroup?.id === groupId) {
      setStudents((prev) => [...prev, ...newStudents]);
    }
    toast.success(`${newStudents.length} донишҷӯ илова шуд`);
  }, [selectedGroup]);

  const handleCreateGroup = async (data: { name: string; description?: string; courseMonthId: number }) => {
    const group = await groupsApi.create(data);
    setMonths((prev) =>
      prev.map((m) => (m.id === data.courseMonthId ? { ...m, groups: [...m.groups, { ...group, students: [] }] } : m))
    );
    setSelectedGroup(group);
    setGroupModal({ open: false });
    toast.success(`"${group.name}" гурӯҳ илова шуд`);
  };

  const handleUpdateGroup = async (data: { name: string; description?: string }) => {
    if (!groupModal.editing) return;
    const updated = await groupsApi.update(groupModal.editing.id, data);
    setMonths((prev) =>
      prev.map((m) => ({
        ...m,
        groups: m.groups.map((g) => (g.id === updated.id ? { ...g, ...updated } : g)),
      }))
    );
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
      setMonths((prev) =>
        prev.map((m) => ({
          ...m,
          groups: m.groups.filter((g) => g.id !== deleteGroup.id),
        }))
      );
      
      // Select another group if the deleted one was selected
      if (selectedGroup?.id === deleteGroup.id) {
        setSelectedGroup(null); // Simple fallback, or logic to pick next
      }
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
    setMonths((prev) =>
      prev.map((m) => ({
        ...m,
        groups: m.groups.map((g) =>
          g.id === data.groupId ? { ...g, students: [...(g.students || []), student] } : g
        )
      }))
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
      setMonths((prev) =>
        prev.map((m) => ({
          ...m,
          groups: m.groups.map((g) => ({ ...g, students: g.students?.filter((s) => s.id !== deleteStudent.id) || [] })),
        }))
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
    () => months.reduce((acc, m) => acc + m.groups.reduce((a, g) => a + (g.students?.length || 0), 0), 0),
    [months],
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#020617]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex font-sans">
      {/* Sidebar Desktop & Mobile */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block z-50`}>
        {/* Backdrop for mobile */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 dark:bg-[#020617]/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        <div className="relative z-50">
          <ClientSidebar
            months={months}
            selectedGroupId={selectedGroup?.id ?? null}
            onGroupSelect={(g) => {
              setSelectedGroup(g);
              setCurrentView('groups');
              setMobileMenuOpen(false);
            }}
            currentUser={user}
            onLogout={handleLogout}
            onNewMonth={handleCreateMonth}
            onNewGroup={(courseMonthId) => setGroupModal({ open: true, courseMonthId })}
            onGlobalLeaderboard={() => setGlobalLeaderboardOpen(true)}
            onSupport={() => {
              setCurrentView('support');
              setMobileMenuOpen(false);
            }}
            onProfile={() => {
              setCurrentView('profile');
              setMobileMenuOpen(false);
            }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 transition-all">
        <ClientHeader
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          totalGroups={months.reduce((acc, m) => acc + m.groups.length, 0)}
          totalStudents={totalStudents}
          loading={loading}
          onRefresh={loadMonths}
        />

        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {currentView === 'support' ? (
            <ClientSupportPage />
          ) : currentView === 'profile' ? (
            <ProfilePage />
          ) : selectedGroup ? (
            <div className="flex flex-col gap-6 animate-modal">
              {/* Group Header Info */}
              <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                      {selectedGroup.name}
                    </h2>
                    {isMentor && (
                      <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity focus-within:opacity-100 group-hover:opacity-100" style={{ opacity: 1 }}>
                        <button
                          onClick={() => setGroupModal({ open: true, editing: selectedGroup })}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                          title="Таҳрир"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteGroup(selectedGroup)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Ҳазф"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  {selectedGroup.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-2xl">
                      {selectedGroup.description}
                    </p>
                  )}
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-wider">
                    {students.length} донишҷӯ
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
                  <WeekNavigator
                    weekStart={weekStart}
                    isCurrentWeek={isCurrentWeek}
                    onPrev={() => setWeekStart((w) => navigateWeek(w, "prev"))}
                    onNext={() => setWeekStart((w) => navigateWeek(w, "next"))}
                    onToday={() => setWeekStart(getWeekStart(new Date()))}
                  />
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/client/report?groupId=${selectedGroup.id}`)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#020617] text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm"
                      title="Ҳисобот"
                    >
                      <FileText size={16} className="text-indigo-500" />
                      <span className="hidden sm:inline">Ҳисобот</span>
                    </button>
                    {isMentor && (
                      <button
                        onClick={() => setStudentModal({ open: true })}
                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        <UserPlus size={16} />
                        <span className="hidden sm:inline">Донишҷӯ</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content Tabs */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800/80">
                  <button
                    onClick={() => setGroupTab('attendance')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                      groupTab === 'attendance'
                        ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    <CalendarDays size={16} />
                    Рӯйхати ҳузур
                  </button>
                  <button
                    onClick={() => setGroupTab('leaderboard')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                      groupTab === 'leaderboard'
                        ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    <Trophy size={16} />
                    Рейтинги гурӯҳ
                  </button>
                </div>

                {groupTab === 'attendance' ? (
                  <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <AttendanceGrid 
                        students={students} 
                        weekDays={weekDays} 
                        groupId={selectedGroup.id} 
                        readOnly={isTeacher} 
                      />
                    </div>

                    {/* Student management */}
                    {students.length > 0 && isMentor && (
                      <div className="border-t border-slate-100 dark:border-slate-800/60 p-5 bg-slate-50/50 dark:bg-transparent">
                        <div className="flex items-center gap-2 mb-4">
                          <Settings size={16} className="text-slate-400" />
                          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Идоракунии донишҷӯён
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {students.map((student) => (
                            <div
                              key={student.id}
                              className="group flex items-center justify-between p-3 bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors shadow-sm"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-indigo-500/20">
                                  {getStudentInitials(student)}
                                </div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                                  {formatStudentName(student)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setStudentModal({ open: true, editing: student })}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                                  title="Таҳрир"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => setDeleteStudent(student)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                  title="Ҳазф"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <LeaderboardPanel groupId={selectedGroup.id} />
                )}

                {isMentor && (
                  <TeacherAssign
                    group={selectedGroup}
                    onAssigned={(g) => {
                      setMonths((prev) =>
                        prev.map((m) => ({
                          ...m,
                          groups: m.groups.map((gr) =>
                            gr.id === g.id
                              ? { ...gr, teacher: g.teacher, teacherId: g.teacherId, teacher2: g.teacher2, teacher2Id: g.teacher2Id }
                              : gr
                          ),
                        }))
                      );
                      setSelectedGroup((prev) =>
                        prev?.id === g.id
                          ? { ...prev, teacher: g.teacher, teacherId: g.teacherId, teacher2: g.teacher2, teacher2Id: g.teacher2Id }
                          : prev
                      );
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-center min-h-[400px]">
              <EmptyState 
                icon={BookOpen} 
                title="Гурӯҳ интихоб нашудааст" 
                description="Лутфан аз менюи тарафи чап гурӯҳеро интихоб кунед." 
              />
            </div>
          )}
        </main>
      </div>

      {/* ─── Modals ─── */}
      <Modal
        isOpen={groupModal.open}
        onClose={() => setGroupModal({ open: false })}
        title={groupModal.editing ? "Гурӯҳро тағйир додан" : "Гурӯҳи нав"}
      >
        <GroupForm
          initial={groupModal.editing}
          courseMonthId={groupModal.courseMonthId}
          onSubmit={groupModal.editing ? handleUpdateGroup : handleCreateGroup as any}
          onCancel={() => setGroupModal({ open: false })}
        />
      </Modal>

      <Modal
        isOpen={studentModal.open}
        onClose={() => setStudentModal({ open: false })}
        title={studentModal.editing ? "Маълумотро тағйир додан" : "Донишҷӯи нав"}
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
        title="Тасдиқи ҳазф"
        message={`Оё мутмаин ҳастед, ки гурӯҳи "${deleteGroup?.name}" ва ҳамаи донишҷӯёни онро ҳазф мекунед? Ин амалро бекор кардан ғайриимкон аст.`}
        loading={deletingGroup}
      />

      <ConfirmDialog
        isOpen={!!deleteStudent}
        onClose={() => setDeleteStudent(null)}
        onConfirm={handleDeleteStudent}
        title="Тасдиқи ҳазф"
        message={`Оё мутмаин ҳастед, ки ${deleteStudent ? formatStudentName(deleteStudent) : ""}-ро ҳазф мекунед?`}
        loading={deletingStudent}
      />

      <GlobalLeaderboardModal
        isOpen={globalLeaderboardOpen}
        onClose={() => setGlobalLeaderboardOpen(false)}
      />

      <AIChatWidget
        groups={months.flatMap(m => m.groups)}
        latestMonthId={months[0]?.id}
        onGroupCreated={handleAIGroupCreated}
        onStudentsAdded={handleAIStudentsAdded}
      />
    </div>
  );
}
