"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  format,
} from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Group, AttendanceReport } from "@/types";
import { groupsApi, reportsApi } from "@/lib/api";
import AttendanceReportView from "@/components/reports/AttendanceReportView";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Printer,
  FileDown,
  ChevronDown,
  Users2,
  CalendarRange,
  AlertTriangle,
  FolderOpen,
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

export default function ReportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupId, setGroupId] = useState<number | null>(null);

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

  /* ─── Auth gate (mirrors /client) ─── */
  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/login");
    else if (user.role === "PENDING") router.replace("/pending");
    else if (user.role === "ADMIN") router.replace("/admin");
  }, [user, authLoading, router]);

  /* ─── Load groups ─── */
  useEffect(() => {
    if (user?.role !== "MENTOR" && user?.role !== "TEACHER") return;
    let cancelled = false;
    groupsApi
      .getAll()
      .then((data) => {
        if (cancelled) return;
        setGroups(data);
        const urlId = Number(
          new URLSearchParams(window.location.search).get("groupId"),
        );
        const picked = data.find((g) => g.id === urlId) ?? data[0] ?? null;
        setGroupId(picked?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) toast.error("Гурӯҳҳо бор нашуданд");
      })
      .finally(() => {
        if (!cancelled) setLoadingGroups(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  /* ─── Fetch report ─── */
  const fetchReport = useCallback(async () => {
    if (!groupId || invalidRange) {
      setReport(null);
      return;
    }
    setReportLoading(true);
    setReportError(false);
    try {
      const data = await reportsApi.getAttendance({
        groupId,
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
  }, [groupId, from, to, invalidRange]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  /* ─── Period controls ─── */
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

  /* ─── Export ─── */
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
    if (!report || !groupId) return;
    setDownloading(true);
    try {
      const blob = await reportsApi.downloadDocx({
        groupId,
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

  /* ─── Loading / redirect ─── */
  if (authLoading || ((user?.role === "MENTOR" || user?.role === "TEACHER") && loadingGroups)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Бор шуда истодааст...
          </p>
        </div>
      </div>
    );
  }
  if (user?.role !== "MENTOR" && user?.role !== "TEACHER") return null;

  const exportDisabled = !report || reportLoading || invalidRange;

  return (
    <div className="print-root min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
      {/* ─── Top bar ─── */}
      <header className="no-print sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <button
            onClick={() => router.push("/client")}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Бозгашт</span>
          </button>

          <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-slate-50 truncate">
            Ҳисоботи ҳузур
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadDocx}
              disabled={exportDisabled || downloading}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-sm font-semibold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {downloading ? <Spinner size="sm" /> : <FileDown size={16} />}
              <span className="hidden sm:inline">Word</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={exportDisabled}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1100px] mx-auto w-full px-4 sm:px-6 py-5 sm:py-6">
        {/* ─── Config card ─── */}
        <div className="no-print bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 sm:p-5">
          <div className="grid lg:grid-cols-[19rem_1fr] gap-5">
            {/* Group selector */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                <Users2 size={13} className="text-indigo-500" />
                Гурӯҳ
              </label>
              {groups.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500 py-2.5">
                  Гурӯҳ нест
                </p>
              ) : (
                <div className="relative">
                  <select
                    value={groupId ?? ""}
                    onChange={(e) => setGroupId(Number(e.target.value))}
                    className="w-full appearance-none rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 pl-3.5 pr-10 py-2.5 text-sm font-medium text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition cursor-pointer"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} — {g.students?.length ?? 0} талаба
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none"
                  />
                </div>
              )}
            </div>

            {/* Period */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                <CalendarRange size={13} className="text-indigo-500" />
                Давра
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {/* Preset chips */}
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

                {/* Custom date range */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <input
                    type="date"
                    value={from}
                    max={to || undefined}
                    onChange={(e) => onDateChange("from", e.target.value)}
                    aria-label="Аз"
                    className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:light] dark:[color-scheme:dark]"
                  />
                  <span className="text-gray-400 dark:text-slate-500 text-xs">
                    —
                  </span>
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
        </div>

        {/* ─── Report preview ─── */}
        <main className="print-area mt-5 print:mt-0">
          {groups.length === 0 ? (
            <div className="no-print bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
              <EmptyState
                icon={FolderOpen}
                title="Гурӯҳ нест"
                description="Барои сохтани ҳисобот аввал гурӯҳ ва талаба илова кунед."
                action={
                  <button
                    onClick={() => router.push("/client")}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Ба гурӯҳҳо гузаштан
                  </button>
                }
              />
            </div>
          ) : invalidRange ? (
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
        </main>
      </div>
    </div>
  );
}
