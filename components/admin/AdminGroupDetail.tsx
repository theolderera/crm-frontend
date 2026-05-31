"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  format,
} from "date-fns";
import { Group, AuthUser, AttendanceReport } from "@/types";
import { reportsApi } from "@/lib/api";
import AttendanceReportView from "@/components/reports/AttendanceReportView";
import TeacherAssign from "@/components/groups/TeacherAssign";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Printer,
  FileDown,
  CalendarRange,
  AlertTriangle,
  UserCircle,
  Users2,
  BookOpen,
} from "lucide-react";

type Preset = "week" | "month" | "days30" | "all" | "custom";

const PRESETS: { key: Exclude<Preset, "custom">; label: string }[] = [
  { key: "week", label: "Ҳафтаи ҷорӣ" },
  { key: "month", label: "Моҳи ҷорӣ" },
  { key: "days30", label: "30 рӯзи охир" },
  { key: "all", label: "Ҳамаи давра" },
];

const iso = (d: Date) => format(d, "yyyy-MM-dd");

function presetRange(preset: Preset): { from: string; to: string } {
  const now = new Date();
  switch (preset) {
    case "week":
      return {
        from: iso(startOfWeek(now, { weekStartsOn: 1 })),
        to: iso(endOfWeek(now, { weekStartsOn: 1 })),
      };
    case "month":
      return { from: iso(startOfMonth(now)), to: iso(endOfMonth(now)) };
    case "days30":
      return { from: iso(subDays(now, 29)), to: iso(now) };
    default:
      return { from: "", to: "" };
  }
}

/**
 * Admin-side detail view of a single group: shows the group meta, lets the
 * admin pick a period and renders / prints / exports the attendance report —
 * the same report mentors get, but reachable from the admin panel.
 */
export default function AdminGroupDetail({
  group,
  onBack,
  onGroupUpdate,
}: {
  group: Group & { mentor?: AuthUser };
  onBack: () => void;
  onGroupUpdate: (updatedGroup: Group) => void;
}) {
  const [preset, setPreset] = useState<Preset>("month");
  const initial = presetRange("month");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const invalidRange = useMemo(
    () => Boolean(from && to && from > to),
    [from, to],
  );

  const fetchReport = useCallback(async () => {
    if (invalidRange) {
      setReport(null);
      return;
    }
    setReportLoading(true);
    setReportError(false);
    try {
      const data = await reportsApi.getAttendance({
        groupId: group.id,
        from: from || undefined,
        to: to || undefined,
      });
      setReport(data);
    } catch {
      setReport(null);
      setReportError(true);
    } finally {
      setReportLoading(false);
    }
  }, [group.id, from, to, invalidRange]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const applyPreset = (p: Exclude<Preset, "custom">) => {
    setPreset(p);
    const r = presetRange(p);
    setFrom(r.from);
    setTo(r.to);
  };

  const onDateChange = (which: "from" | "to", value: string) => {
    setPreset("custom");
    if (which === "from") setFrom(value);
    else setTo(value);
  };

  const periodSlug = useMemo(
    () => (from && to ? `${from}_${to}` : "ҳамаи-давра"),
    [from, to],
  );

  const handlePrint = () => {
    if (!report) return;
    const prevTitle = document.title;
    document.title = `Ҳисобот — ${report.group.name}`;
    const restore = () => {
      document.title = prevTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
    window.setTimeout(restore, 1500);
  };

  const handleDownloadDocx = async () => {
    if (!report) return;
    setDownloading(true);
    try {
      const blob = await reportsApi.downloadDocx({
        groupId: group.id,
        from: from || undefined,
        to: to || undefined,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Ҳисобот - ${report.group.name} - ${periodSlug}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Файли Word боргирӣ шуд");
    } catch {
      toast.error("Файл боргирӣ нашуд");
    } finally {
      setDownloading(false);
    }
  };

  const exportDisabled = !report || reportLoading || invalidRange;
  const studentCount = group.students?.length ?? 0;
  const mentorName = group.mentor
    ? [group.mentor.firstName, group.mentor.lastName].filter(Boolean).join(" ")
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* ─── Toolbar ─── */}
      <div className="no-print flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-gray-200 dark:border-slate-700"
        >
          <ArrowLeft size={16} />
          <span>Бозгашт</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadDocx}
            disabled={exportDisabled || downloading}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-sm font-semibold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {downloading ? <Spinner size="sm" /> : <FileDown size={16} />}
            <span className="hidden sm:inline">Word</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={exportDisabled}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">PDF чоп</span>
          </button>
        </div>
      </div>

      {/* ─── Config card ─── */}
      <div className="no-print bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 sm:p-5">
        {/* Group meta */}
        <div className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
            <BookOpen size={20} className="text-indigo-500" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {group.name}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                <UserCircle size={13} />
                {mentorName ?? "Бе ментор"}
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                <Users2 size={13} />
                {studentCount} донишҷӯ
              </span>
            </div>
            {group.description && (
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                {group.description}
              </p>
            )}
          </div>
        </div>

        {/* Period */}
        <div className="pt-4">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            <CalendarRange size={13} className="text-indigo-500" />
            Давра
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => applyPreset(p.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    preset === p.key
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-600"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 sm:ml-auto">
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => onDateChange("from", e.target.value)}
                aria-label="Аз"
                className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:light] dark:[color-scheme:dark]"
              />
              <span className="text-gray-400 dark:text-slate-500 text-xs">—</span>
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => onDateChange("to", e.target.value)}
                aria-label="То"
                className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>
          {invalidRange && (
            <p className="flex items-center gap-1.5 text-xs text-red-500 mt-2">
              <AlertTriangle size={13} />
              Санаи «аз» бояд пеш аз «то» бошад.
            </p>
          )}
        </div>
      </div>

      <div className="no-print">
        <TeacherAssign 
          group={group} 
          onAssigned={(updatedGroup) => onGroupUpdate(updatedGroup)} 
        />
      </div>

      {/* ─── Report ─── */}
      <div className="print-area">
        {invalidRange ? (
          <div className="no-print bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm py-16">
            <EmptyState
              icon={AlertTriangle}
              title="Фосилаи сана нодуруст"
              description="Лутфан санаҳои оғоз ва анҷомро дуруст интихоб кунед."
            />
          </div>
        ) : reportLoading ? (
          <div className="no-print bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-3 py-24">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Ҳисобот тайёр шуда истодааст...
            </p>
          </div>
        ) : reportError ? (
          <div className="no-print bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm py-16">
            <EmptyState
              icon={AlertTriangle}
              title="Ҳисобот бор нашуд"
              description="Ҳангоми гирифтани маълумот хатогӣ рӯй дод."
              action={
                <button
                  onClick={fetchReport}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Бори дигар кӯшиш кунед
                </button>
              }
            />
          </div>
        ) : report ? (
          <div className="mx-auto w-full max-w-[860px] print:max-w-none">
            <AttendanceReportView report={report} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
