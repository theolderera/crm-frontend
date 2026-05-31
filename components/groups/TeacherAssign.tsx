'use client';

import { useState, useEffect } from 'react';
import { AuthUser, Group } from '@/types';
import { usersApi, groupsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';
import { Search, UserCheck, UserPlus, AlertCircle, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function TeacherAssign({
  group,
  onAssigned,
}: {
  group: Group;
  onAssigned: (updatedGroup: Group) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [unassigningId, setUnassigningId] = useState<number | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'assign' | 'unassign';
    teacher: AuthUser | null;
  }>({ isOpen: false, action: 'assign', teacher: null });

  // Auto-search when query changes
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await usersApi.searchPending(query);
        setResults(data);
      } catch {
        // ignore search errors
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleAssign = async () => {
    const teacher = confirmModal.teacher;
    if (!teacher) return;
    
    setAssigningId(teacher.id);
    try {
      const updated = await groupsApi.assignTeacher(group.id, teacher.id);
      toast.success('Муаллими асосӣ вобаста карда шуд!');
      onAssigned(updated);
      setQuery('');
      setConfirmModal({ ...confirmModal, isOpen: false });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Хатогӣ ҳангоми вобастакунӣ');
    } finally {
      setAssigningId(null);
    }
  };

  const handleUnassign = async () => {
    const teacher = confirmModal.teacher;
    if (!teacher) return;
    
    setUnassigningId(teacher.id);
    try {
      const updated = await groupsApi.unassignTeacher(group.id, teacher.id);
      toast.success('Муаллим аз гурӯҳ хориҷ карда шуд!');
      onAssigned(updated);
      setConfirmModal({ ...confirmModal, isOpen: false });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Хатогӣ ҳангоми хориҷкунӣ');
    } finally {
      setUnassigningId(null);
    }
  };

  const hasTwoTeachers = group.teacher && group.teacher2;

  const renderTeacher = (teacher: AuthUser, label: string) => (
    <div key={teacher.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 mb-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
          {teacher.firstName[0]}
        </div>
        <div className="min-w-0 pr-2">
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {teacher.firstName} {teacher.lastName}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 truncate">
            <UserCheck size={12} /> {label}
          </p>
        </div>
      </div>
      <button
        onClick={() => setConfirmModal({ isOpen: true, action: 'unassign', teacher })}
        disabled={unassigningId === teacher.id}
        title="Хориҷ кардани муаллим"
        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0 disabled:opacity-50"
      >
        {unassigningId === teacher.id ? <Spinner size="sm" /> : <Trash2 size={16} />}
      </button>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
          <UserPlus size={16} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Муаллимони асосӣ</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">Муаллимро пайдо карда вобаста кунед (то 2 нафар)</p>
        </div>
      </div>

      {group.teacher && renderTeacher(group.teacher, "Муаллими 1")}
      {group.teacher2 && renderTeacher(group.teacher2, "Муаллими 2")}

      {!hasTwoTeachers ? (
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ҷустуҷӯ аз рӯи ном, телефон ё почта..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Spinner size="sm" />
              </div>
            )}
          </div>

          {results.length > 0 && (
            <div className="border border-gray-100 dark:border-slate-700 rounded-xl divide-y divide-gray-50 dark:divide-slate-800 max-h-48 overflow-y-auto">
              {results.map((user) => (
                <div key={user.id} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.phone} · {user.email}</p>
                  </div>
                  <button
                    onClick={() => setConfirmModal({ isOpen: true, action: 'assign', teacher: user })}
                    disabled={assigningId === user.id || group.teacher?.id === user.id || group.teacher2?.id === user.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                  >
                    {assigningId === user.id ? <Spinner size="sm" /> : <UserPlus size={14} />}
                    <span>{group.teacher?.id === user.id || group.teacher2?.id === user.id ? 'Банд' : 'Интихоб'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {query.length > 1 && results.length === 0 && !loading && (
            <div className="p-3 text-center text-sm text-gray-500 flex items-center justify-center gap-1.5 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
              <AlertCircle size={14} /> Муаллим ёфт нашуд
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 text-center text-sm text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
          Ҷойҳои муаллимон пур шуданд
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.action === 'assign' ? handleAssign : handleUnassign}
        title={confirmModal.action === 'assign' ? "Вобаста кардани муаллим" : "Хориҷ кардани муаллим"}
        message={
          confirmModal.action === 'assign' 
            ? `Оё мутмаин ҳастед, ки ${confirmModal.teacher?.firstName} ${confirmModal.teacher?.lastName || ''}-ро ба ин гурӯҳ вобаста мекунед?`
            : `Оё мутмаин ҳастед, ки ${confirmModal.teacher?.firstName} ${confirmModal.teacher?.lastName || ''}-ро аз ин гурӯҳ хориҷ мекунед?`
        }
        loading={confirmModal.action === 'assign' ? assigningId !== null : unassigningId !== null}
      />
    </div>
  );
}
