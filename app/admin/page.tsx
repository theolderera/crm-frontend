"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi } from "@/lib/api";
import { AuthUser, Group, Student } from "@/types";
import toast from "react-hot-toast";

import AdminSidebar, { AdminTab } from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminUsersPanel from "@/components/admin/AdminUsersPanel";
import AdminGroupsPanel from "@/components/admin/AdminGroupsPanel";
import AdminStudentsPanel from "@/components/admin/AdminStudentsPanel";
import AdminGroupDetail from "@/components/admin/AdminGroupDetail";
import AdminSupportPage from "./support/page";
import ProfilePage from "../client/profile/page";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Spinner from "@/components/ui/Spinner";

type AdminGroup = Group & { mentor?: AuthUser };

function AdminContent() {
  const { user: currentUser, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) router.replace("/login");
    else if (currentUser.role === "MENTOR" || currentUser.role === "TEACHER") router.replace("/client");
    else if (currentUser.role !== "ADMIN") router.replace("/welcome");
  }, [currentUser, authLoading, router]);

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

  const stats = useMemo(
    () => ({
      total: users.length,
      mentors: users.filter((u) => u.role === "MENTOR").length,
      pending: users.filter((u) => u.role === "USER").length,
      admins: users.filter((u) => u.role === "ADMIN").length,
      groups: groups.length,
      students: students.length,
    }),
    [users, groups, students],
  );

  const pendingUsers = useMemo(() => users.filter((u) => u.role === "USER"), [users]);
  
  // Recent users sorted by date (newest first)
  const recentUsers = useMemo(() => {
    return [...users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [users]);

  const groupsByMentor = useMemo(() => {
    const m = new Map<number, number>();
    groups.forEach((g) => {
      if (g.mentorId != null) m.set(g.mentorId, (m.get(g.mentorId) ?? 0) + 1);
    });
    return m;
  }, [groups]);

  function switchTab(tab: AdminTab) {
    setActiveTab(tab);
    setSearch("");
    setSelectedGroupId(null);
    setMobileMenuOpen(false);
  }

  if (authLoading) {
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
          <AdminSidebar
            activeTab={activeTab}
            onTabChange={switchTab}
            currentUser={currentUser}
            onLogout={handleLogout}
            stats={stats}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 transition-all">
        <AdminHeader
          search={search}
          onSearchChange={setSearch}
          pendingCount={stats.pending}
          loading={loading}
          onRefresh={loadData}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {selectedGroup ? (
            <AdminGroupDetail
              group={selectedGroup}
              onBack={() => setSelectedGroupId(null)}
              onGroupUpdate={(g) => {
                setGroups(prev => prev.map(gr => gr.id === g.id ? {...gr, teacher: g.teacher, teacherId: g.teacherId, teacher2: g.teacher2, teacher2Id: g.teacher2Id} : gr));
              }}
            />
          ) : (
            <div className="animate-modal">
              {loading && users.length === 0 ? (
                <div className="flex items-center justify-center py-32">
                  <Spinner size="lg" />
                </div>
              ) : (
                <>
                  {activeTab === "dashboard" && (
                    <AdminDashboard
                      stats={stats}
                      pendingUsers={pendingUsers}
                      recentUsers={recentUsers}
                      changingRole={changingRole}
                      onApprove={(id) => handleRoleChange(id, "MENTOR")}
                      onGoTab={switchTab}
                    />
                  )}

                  {activeTab === "users" && (
                    <AdminUsersPanel
                      users={users.filter(u => 
                        !search || 
                        u.firstName.toLowerCase().includes(search.toLowerCase()) || 
                        u.lastName?.toLowerCase().includes(search.toLowerCase()) || 
                        u.email.toLowerCase().includes(search.toLowerCase())
                      )}
                      currentUserId={currentUser?.id}
                      changingRole={changingRole}
                      deletingId={deletingId}
                      groupsByMentor={groupsByMentor}
                      onRoleChange={handleRoleChange}
                      onDelete={handleDeleteUser}
                    />
                  )}

                  {activeTab === "groups" && (
                    <AdminGroupsPanel
                      groups={groups.filter(g => 
                        !search || 
                        g.name.toLowerCase().includes(search.toLowerCase()) ||
                        g.mentor?.firstName.toLowerCase().includes(search.toLowerCase())
                      )}
                      deletingId={deletingId}
                      onOpen={(id) => setSelectedGroupId(id)}
                      onDelete={handleDeleteGroup}
                    />
                  )}

                  {activeTab === "students" && (
                    <AdminStudentsPanel
                      students={students.filter(s => 
                        !search || 
                        s.firstName.toLowerCase().includes(search.toLowerCase()) || 
                        s.lastName?.toLowerCase().includes(search.toLowerCase()) ||
                        s.group?.name.toLowerCase().includes(search.toLowerCase())
                      )}
                      deletingId={deletingId}
                      onDelete={handleDeleteStudent}
                    />
                  )}

                  {activeTab === "support" && (
                    <AdminSupportPage />
                  )}

                  {activeTab === "profile" && (
                    <ProfilePage />
                  )}
                </>
              )}
            </div>
          )}
        </main>
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

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#020617]">
          <Spinner size="lg" />
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
