'use client';

import { useState } from 'react';
import { Group } from '@/types';
import { getApiError } from '@/lib/formatters';
import Spinner from '@/components/ui/Spinner';
import { useTranslation } from "@/contexts/LanguageContext";

interface GroupFormProps {
  initial?: Group;
  courseMonthId?: number;
  onSubmit: (data: { name: string; description?: string; courseMonthId?: number }) => Promise<void>;
  onCancel: () => void;
}

export default function GroupForm({ initial, courseMonthId, onSubmit, onCancel }: GroupFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError(t("forms.group_name_req")); return; }
    setLoading(true);
    setError('');
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || undefined, courseMonthId });
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
          {t("forms.group_name")} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Масалан: A-01, Group 1..."
          className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
          {t("forms.group_desc")} <span className="text-gray-400 dark:text-slate-500 font-normal">{t("forms.optional")}</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Тавсифи гурӯҳ..."
          rows={3}
          className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {t("forms.cancel")}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Spinner size="sm" />}
          {initial ? t("forms.update") : t("forms.create")}
        </button>
      </div>
    </form>
  );
}
