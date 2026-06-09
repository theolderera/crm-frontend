"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Student, WeekDay } from "@/types";
import { attendanceApi } from "@/lib/api";
import { getStudentInitials, formatStudentName } from "@/lib/formatters";
import { Check, X, Clock, Info, BookOpen } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import toast from "react-hot-toast";
import { useTranslation } from "@/contexts/LanguageContext";

interface AttendanceGridProps {
  students: Student[];
  weekDays: WeekDay[];
  groupId: number;
  readOnly?: boolean;
}

type AttendanceMap = Record<string, boolean>;
type LateMap = Record<string, { minutes: number | null; note: string | null }>;
type ExcusedMap = Record<string, { excused: boolean; reason: string | null }>;
type HwMap = Record<string, number | null>;

function makeKey(studentId: number, date: string) {
  return `${studentId}_${date}`;
}

function getAttendanceBtnClass(
  isToggling: boolean,
  isPresent: boolean,
  isLate: boolean,
  isExcused: boolean,
): string {
  if (isToggling) return "opacity-50 cursor-wait bg-slate-100 dark:bg-slate-800 rounded-xl";
  if (isPresent)
    return "rounded-xl border-none text-white hover:scale-105 active:scale-95 transition-all shadow-md";
  if (isExcused)
    return "bg-gradient-to-br from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 shadow-md shadow-rose-500/30 dark:shadow-rose-900/40 border-none rounded-xl text-white hover:scale-105 active:scale-95 transition-all";
  return "bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200/50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl transition-all";
}

function getAttendanceBtnStyle(isPresent: boolean, lateMinutes: number): React.CSSProperties | undefined {
  if (!isPresent) return undefined;
  
  // 120 hue = Green (On time), 0 hue = Red (120 min late)
  const hue = Math.max(0, 120 - Math.min(120, lateMinutes));
  const isLate = lateMinutes > 0;
  const light1 = isLate ? 50 : 45;
  const light2 = isLate ? 45 : 40;
  
  return {
    background: `linear-gradient(135deg, hsl(${hue}, 85%, ${light1}%), hsl(${Math.max(0, hue - 10)}, 90%, ${light2}%))`,
    boxShadow: `0 4px 12px -2px hsla(${hue}, 80%, 40%, 0.4)`,
  };
}

function formatLateMinutesShort(m: number, t: any): string {
  if (m < 60) return `${m}${t("attendance.min").charAt(0)}`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (min === 0) return `${h}${t("attendance.hours")}`;
  return `${h}:${min.toString().padStart(2, '0')}`;
}

function formatLateTitle(m: number, note: string | null, t: any): string {
  let timeStr = "";
  if (m < 60) timeStr = `${m} ${t("attendance.min")}`;
  else {
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (min === 0) timeStr = `${h} ${t("attendance.hours")}`;
    else timeStr = `${h} ${t("attendance.hours_and")}${min} ${t("attendance.min")}`;
  }
  return `${timeStr} ${t("attendance.late").toLowerCase()} — ${note || t("attendance.no_reason")}`;
}

function getPercentageColor(pct: number): string {
  if (pct >= 80) return "text-green-600 dark:text-green-400";
  if (pct >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-500 dark:text-red-400";
}

/* ─── Late Popup ─── */
interface LatePopupProps {
  studentId: number;
  date: string;
  currentMinutes: number | null;
  currentNote: string | null;
  onSave: (studentId: number, date: string, minutes: number, note: string) => void;
  onRemove: (studentId: number, date: string) => void;
  onClose: () => void;
}

function LatePopup({ studentId, date, currentMinutes, currentNote, onSave, onRemove, onClose }: LatePopupProps) {
  const { t } = useTranslation();
  const [minutes, setMinutes] = useState(currentMinutes ?? 5);
  const [note, setNote] = useState(currentNote ?? "");
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="absolute z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl dark:shadow-slate-900/70 border border-gray-200 dark:border-slate-700 p-4 w-64 animate-in fade-in zoom-in-95 duration-150"
      style={{ top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: "8px" }}
    >
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 border-t border-l border-gray-200 dark:border-slate-700 rotate-45" />

      <div className="relative">
        <p className="text-xs font-bold text-gray-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
          <Clock size={13} className="text-amber-500" />
          {t("attendance.late")}
        </p>

        <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
          {t("attendance.late_minutes")}
        </label>
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setMinutes(Math.max(1, minutes - 5))}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-bold transition-colors"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={120}
            value={minutes}
            onChange={(e) => setMinutes(Math.min(120, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-16 h-8 text-center rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm font-bold text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            onClick={() => setMinutes(Math.min(120, minutes + 5))}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-bold transition-colors"
          >
            +
          </button>
          <span className="text-xs text-gray-400 dark:text-slate-500">{t("attendance.min")}</span>
        </div>
        
        {minutes >= 60 && (
          <div className="text-center mb-3">
            <span className="inline-block px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-200 dark:border-amber-800/50">
              {formatLateTitle(minutes, null, t).split(` ${t("attendance.late").toLowerCase()}`)[0]}
            </span>
          </div>
        )}

        <div className="flex gap-1.5 mb-3">
          {[5, 10, 15, 30].map((m) => (
            <button
              key={m}
              onClick={() => setMinutes(m)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${minutes === m
                  ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                  : "bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600"
                }`}
            >
              {m}&apos;
            </button>
          ))}
        </div>

        <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
          {t("forms.group_desc")} {t("forms.optional")}
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("attendance.late_placeholder")}
          className="w-full h-8 px-3 text-sm rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 mb-3"
        />

        <div className="flex gap-2">
          <button
            onClick={() => onSave(studentId, date, minutes, note)}
            className="flex-1 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-sm"
          >
            {t("attendance.save")}
          </button>
          {currentMinutes != null && (
            <button
              onClick={() => onRemove(studentId, date)}
              className="py-2 px-3 text-xs font-medium rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 dark:text-slate-400 hover:text-red-500 transition-colors"
            >
              {t("attendance.remove")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Excused Popup ─── */
interface ExcusedPopupProps {
  studentId: number;
  date: string;
  currentReason: string | null;
  onSave: (studentId: number, date: string, reason: string) => void;
  onRemove: (studentId: number, date: string) => void;
  onClose: () => void;
}

function ExcusedPopup({ studentId, date, currentReason, onSave, onRemove, onClose }: ExcusedPopupProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState(currentReason ?? "");
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="absolute z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl dark:shadow-slate-900/70 border border-gray-200 dark:border-slate-700 p-4 w-64 animate-in fade-in zoom-in-95 duration-150"
      style={{ top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: "8px" }}
    >
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 border-t border-l border-gray-200 dark:border-slate-700 rotate-45" />
      <div className="relative">
        <p className="text-xs font-bold text-gray-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
          <Info size={13} className="text-red-500" />
          {t("attendance.reason_title")}
        </p>
        <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
          {t("attendance.reason_desc")}
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("attendance.reason_placeholder")}
          className="w-full h-8 px-3 text-sm rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-400 mb-3"
        />
        <div className="flex gap-2">
          <button
            onClick={() => onSave(studentId, date, reason)}
            className="flex-1 py-2 text-xs font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm"
          >
            {t("attendance.save")}
          </button>
          {currentReason != null && (
            <button
              onClick={() => onRemove(studentId, date)}
              className="py-2 px-3 text-xs font-medium rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 dark:text-slate-400 hover:text-red-500 transition-colors"
            >
              {t("attendance.remove")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Grid ─── */
export default function AttendanceGrid({
  students,
  weekDays,
  groupId,
  readOnly,
}: AttendanceGridProps) {
  const { t } = useTranslation();
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [lateData, setLateData] = useState<LateMap>({});
  const [excusedData, setExcusedData] = useState<ExcusedMap>({});
  const [hwData, setHwData] = useState<HwMap>({});
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [latePopup, setLatePopup] = useState<{ studentId: number; date: string } | null>(null);
  const [excusedPopup, setExcusedPopup] = useState<{ studentId: number; date: string } | null>(null);

  const weekStartDate = weekDays[0]?.date ?? "";

  const loadAttendance = useCallback(async () => {
    if (!weekStartDate || !students.length) return;
    setLoading(true);
    try {
      const records = await attendanceApi.getWeekly(groupId, weekStartDate);
      const map: AttendanceMap = {};
      const late: LateMap = {};
      const exc: ExcusedMap = {};
      const hw: HwMap = {};
      records.forEach((r) => {
        const key = makeKey(r.studentId, r.date);
        map[key] = r.present;
        late[key] = {
          minutes: r.lateMinutes ?? null,
          note: r.lateNote ?? null,
        };
        exc[key] = {
          excused: r.excused ?? false,
          reason: r.excusedReason ?? null,
        };
        hw[key] = r.hwSolved ?? null;
      });
      setAttendance(map);
      setLateData(late);
      setExcusedData(exc);
      setHwData(hw);
    } catch {
      toast.error(t("common.load_error"));
    } finally {
      setLoading(false);
    }
  }, [groupId, weekStartDate, students.length]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const toggle = async (studentId: number, date: string) => {
    if (readOnly) return;
    const key = makeKey(studentId, date);
    const current = attendance[key] ?? false;
    const next = !current;

    setToggling(key);
    setAttendance((prev) => ({ ...prev, [key]: next }));

    if (!next) {
      setLateData((prev) => ({ ...prev, [key]: { minutes: null, note: null } }));
    } else {
      setExcusedData((prev) => ({ ...prev, [key]: { excused: false, reason: null } }));
    }

    try {
      await attendanceApi.upsert({
        studentId,
        date,
        present: next,
        lateMinutes: next ? (lateData[key]?.minutes ?? null) : null,
        lateNote: next ? (lateData[key]?.note ?? null) : null,
        excused: !next ? (excusedData[key]?.excused ?? false) : false,
        excusedReason: !next ? (excusedData[key]?.reason ?? null) : null,
      });
    } catch {
      setAttendance((prev) => ({ ...prev, [key]: current }));
      toast.error(t("common.save_error"));
    } finally {
      setToggling(null);
    }
  };

  const handleSaveLate = async (studentId: number, date: string, minutes: number, note: string) => {
    const key = makeKey(studentId, date);
    setLatePopup(null);

    const prevLate = lateData[key] ?? { minutes: null, note: null };
    setLateData((prev) => ({ ...prev, [key]: { minutes, note: note || null } }));

    try {
      await attendanceApi.upsert({
        studentId,
        date,
        present: true,
        lateMinutes: minutes,
        lateNote: note || null,
        excused: false,
        excusedReason: null,
      });
      toast.success(`${minutes}${t("attendance.late_saved_suffix")}`);
    } catch {
      setLateData((prev) => ({ ...prev, [key]: prevLate }));
      toast.error(t("common.save_error"));
    }
  };

  const handleRemoveLate = async (studentId: number, date: string) => {
    const key = makeKey(studentId, date);
    setLatePopup(null);

    const prevLate = lateData[key] ?? { minutes: null, note: null };
    setLateData((prev) => ({ ...prev, [key]: { minutes: null, note: null } }));

    try {
      await attendanceApi.upsert({
        studentId,
        date,
        present: true,
        lateMinutes: null,
        lateNote: null,
        excused: false,
        excusedReason: null,
      });
      toast.success(t("attendance.late_removed"));
    } catch {
      setLateData((prev) => ({ ...prev, [key]: prevLate }));
      toast.error(t("common.error_occurred"));
    }
  };

  const handleSaveExcused = async (studentId: number, date: string, reason: string) => {
    const key = makeKey(studentId, date);
    setExcusedPopup(null);

    const prevExc = excusedData[key] ?? { excused: false, reason: null };
    setExcusedData((prev) => ({ ...prev, [key]: { excused: true, reason } }));

    try {
      await attendanceApi.upsert({
        studentId,
        date,
        present: false,
        lateMinutes: null,
        lateNote: null,
        excused: true,
        excusedReason: reason || null,
      });
      toast.success(t("attendance.excused_saved"));
    } catch {
      setExcusedData((prev) => ({ ...prev, [key]: prevExc }));
      toast.error(t("common.save_error"));
    }
  };

  const handleRemoveExcused = async (studentId: number, date: string) => {
    const key = makeKey(studentId, date);
    setExcusedPopup(null);

    const prevExc = excusedData[key] ?? { excused: false, reason: null };
    setExcusedData((prev) => ({ ...prev, [key]: { excused: false, reason: null } }));

    try {
      await attendanceApi.upsert({
        studentId,
        date,
        present: false,
        lateMinutes: null,
        lateNote: null,
        excused: false,
        excusedReason: null,
      });
      toast.success(t("attendance.excused_removed"));
    } catch {
      setExcusedData((prev) => ({ ...prev, [key]: prevExc }));
      toast.error(t("common.error_occurred"));
    }
  };

  const handleHwChange = async (studentId: number, date: string, val: string) => {
    if (readOnly) return;
    const key = makeKey(studentId, date);
    const parsed = val === "" ? null : parseInt(val, 10);
    const hwSolved = parsed !== null && !isNaN(parsed) ? Math.max(0, parsed) : null;

    const prevHw = hwData[key] ?? null;
    setHwData((prev) => ({ ...prev, [key]: hwSolved }));

    try {
      await attendanceApi.upsert({
        studentId,
        date,
        present: attendance[key] ?? false,
        lateMinutes: lateData[key]?.minutes ?? null,
        lateNote: lateData[key]?.note ?? null,
        excused: excusedData[key]?.excused ?? false,
        excusedReason: excusedData[key]?.reason ?? null,
        hwSolved,
      });
    } catch {
      setHwData((prev) => ({ ...prev, [key]: prevHw }));
      toast.error(t("common.save_error"));
    }
  };

  const markAllPresent = async (date: string) => {
    if (readOnly) return;
    const records = students.map((s) => ({ studentId: s.id, present: true, excused: false, excusedReason: null }));
    try {
      await attendanceApi.bulkUpsert({ date, records });
      const updates: AttendanceMap = {};
      const excUpdates: ExcusedMap = {};
      students.forEach((s) => {
        const key = makeKey(s.id, date);
        updates[key] = true;
        excUpdates[key] = { excused: false, reason: null };
      });
      setAttendance((prev) => ({ ...prev, ...updates }));
      setExcusedData((prev) => ({ ...prev, ...excUpdates }));
      toast.success(t("attendance.all_present_success"));
    } catch {
      toast.error(t("common.error_occurred"));
    }
  };

  const getStats = (date: string) => {
    const present = students.filter(
      (s) => attendance[makeKey(s.id, date)] === true,
    ).length;
    const lateCount = students.filter((s) => {
      const key = makeKey(s.id, date);
      return attendance[key] === true && lateData[key]?.minutes != null && lateData[key].minutes! > 0;
    }).length;
    const excusedCount = students.filter((s) => {
      const key = makeKey(s.id, date);
      return attendance[key] === false && excusedData[key]?.excused === true;
    }).length;
    const hwTotal = students.reduce((sum, s) => sum + (hwData[makeKey(s.id, date)] ?? 0), 0);
    return { present, absent: students.length - present - excusedCount, late: lateCount, excused: excusedCount, hw: hwTotal };
  };

  const isDataLoading = loading && Object.keys(attendance).length === 0;

  if (!students.length) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 dark:text-slate-500 text-sm">
        {t("attendance.no_students")}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto transition-opacity duration-300 relative ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
      {loading && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 overflow-hidden z-50">
          <div className="h-full bg-indigo-500 animate-pulse" style={{ width: '100%', animation: 'progress 1s ease-in-out infinite' }} />
        </div>
      )}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left py-4 px-5 text-xs font-bold text-slate-500 dark:text-indigo-200 uppercase tracking-wider bg-slate-50/80 dark:bg-indigo-950/40 rounded-tl-2xl min-w-[180px] sticky left-0 border-b border-slate-200/80 dark:border-indigo-900/30 z-10">
              {t("attendance.full_name")}
            </th>
            {weekDays.map((day) => {
              const stats = getStats(day.date);
              return (
                <th
                  key={day.date}
                  className={`py-4 px-2 text-center min-w-[80px] border-b border-slate-200/80 dark:border-indigo-900/30 ${day.isToday
                      ? "bg-indigo-50 dark:bg-indigo-900/40"
                      : "bg-slate-50/80 dark:bg-indigo-950/40"
                    }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={`text-xs font-bold uppercase tracking-wide ${day.isToday
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-gray-500 dark:text-slate-400"
                        }`}
                    >
                      {day.label}
                    </span>
                    {day.isToday && (
                      <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-medium">
                        {t("attendance.today")}
                      </span>
                    )}
                    <div className="flex gap-1.5 mt-0.5">
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center gap-0.5">
                        {stats.present}<Check size={10} />
                      </span>
                      {stats.late > 0 && (
                        <span className="text-[10px] text-amber-500 dark:text-amber-400 font-medium flex items-center gap-0.5">
                          {stats.late}<Clock size={10} />
                        </span>
                      )}
                      {stats.excused > 0 && (
                        <span className="text-[10px] text-red-500 dark:text-red-400 font-medium flex items-center gap-0.5">
                          {stats.excused}<Info size={10} />
                        </span>
                      )}
                      {stats.hw > 0 && (
                        <span className="text-[10px] text-purple-500 dark:text-purple-400 font-medium flex items-center gap-0.5">
                          {stats.hw}<BookOpen size={10} />
                        </span>
                      )}
                      <span className="text-[10px] text-red-400 dark:text-red-500 font-medium flex items-center gap-0.5">
                        {stats.absent}<X size={10} />
                      </span>
                    </div>
                    {!readOnly && (
                      <button
                        onClick={() => markAllPresent(day.date)}
                        className="text-[10px] text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors mt-0.5"
                      >
                        {t("attendance.all_present")}
                      </button>
                    )}
                  </div>
                </th>
              );
            })}
            <th className="py-4 px-3 text-center text-xs font-bold text-slate-500 dark:text-indigo-200 uppercase tracking-wider bg-slate-50/80 dark:bg-indigo-950/40 rounded-tr-2xl min-w-[90px] border-b border-slate-200/80 dark:border-indigo-900/30 z-10">
              {t("attendance.summary")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/80 dark:divide-white/5">
          {[...students]
            .sort((a, b) => {
              const today = weekDays.find((d) => d.isToday);
              if (!today) return 0;
              const aPresent = attendance[makeKey(a.id, today.date)] === true;
              const bPresent = attendance[makeKey(b.id, today.date)] === true;
              if (aPresent === bPresent) return 0;
              return aPresent ? -1 : 1;
            })
            .map((student, idx) => {
              const presentCount = weekDays.filter(
                (d) => attendance[makeKey(student.id, d.date)] === true,
              ).length;
              const pct =
                weekDays.length > 0
                  ? Math.round((presentCount / weekDays.length) * 100)
                  : 0;
              const totalLateMinutes = weekDays.reduce((sum, d) => {
                const key = makeKey(student.id, d.date);
                return sum + (lateData[key]?.minutes ?? 0);
              }, 0);
              const excusedCount = weekDays.filter((d) => {
                const key = makeKey(student.id, d.date);
                return attendance[key] === false && excusedData[key]?.excused === true;
              }).length;
              const totalHw = weekDays.reduce((sum, d) => {
                const key = makeKey(student.id, d.date);
                return sum + (hwData[key] ?? 0);
              }, 0);

              return (
                <tr
                  key={student.id}
                  className={`hover:bg-indigo-50/50 dark:hover:bg-white/5 transition-colors ${idx % 2 === 0 ? "bg-transparent" : "bg-slate-50/30 dark:bg-white/[0.02]"
                    }`}
                >
                  <td className="py-3 px-4 sticky left-0 bg-inherit">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                        {getStudentInitials(student)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          {formatStudentName(student)}
                        </p>
                        {student.phone && (
                          <p className="text-xs text-gray-400 dark:text-slate-500">
                            {student.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  {weekDays.map((day) => {
                    const key = makeKey(student.id, day.date);
                    const isPresent = attendance[key] === true;
                    const isTogglingThis = toggling === key;

                    const late = lateData[key];
                    const isLate = isPresent && late?.minutes != null && late.minutes > 0;
                    const isPopupOpen = latePopup?.studentId === student.id && latePopup?.date === day.date;

                    const exc = excusedData[key];
                    const isExcused = !isPresent && exc?.excused === true;
                    const isExcPopupOpen = excusedPopup?.studentId === student.id && excusedPopup?.date === day.date;
                    const hwVal = hwData[key] ?? 0;

                    return (
                      <td
                        key={day.date}
                        className={`py-3 px-2 text-center ${day.isToday
                            ? "bg-indigo-50/40 dark:bg-indigo-900/10"
                            : ""
                          }`}
                      >
                        <div className="relative inline-flex flex-col items-center gap-1">
                          <button
                            onClick={() => toggle(student.id, day.date)}
                            disabled={isTogglingThis || readOnly}
                            className={`w-9 h-9 flex items-center justify-center mx-auto ${getAttendanceBtnClass(isTogglingThis, isPresent, isLate, isExcused)}`}
                            style={getAttendanceBtnStyle(isPresent, late?.minutes || 0)}
                            title={isLate ? formatLateTitle(late?.minutes || 0, late?.note || null, t) : isExcused ? `${t("attendance.excused")}: ${exc?.reason || t("attendance.no_reason")}` : undefined}
                          >
                            {isPresent ? (
                              isLate ? (
                                <span className="text-[11px] font-bold text-white leading-none tracking-tighter">
                                  {formatLateMinutesShort(late?.minutes || 0, t)}
                                </span>
                              ) : (
                                <Check
                                  size={16}
                                  className="text-white"
                                  strokeWidth={3}
                                />
                              )
                            ) : (
                              isExcused ? (
                                <Info size={16} className="text-white" strokeWidth={3} />
                              ) : (
                                <X
                                  size={14}
                                  className="text-gray-400 dark:text-slate-500"
                                />
                              )
                            )}
                          </button>

                          {isPresent && !isTogglingThis && !readOnly && (
                            <button
                              onClick={() => setLatePopup(isPopupOpen ? null : { studentId: student.id, date: day.date })}
                              className={`w-6 h-4 rounded-md flex items-center justify-center transition-all text-[9px] font-medium ${isLate
                                  ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700"
                                  : "bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-gray-200 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-700"
                                }`}
                              title={t("attendance.late")}
                            >
                              <Clock size={9} />
                            </button>
                          )}

                          {isPopupOpen && (
                            <LatePopup
                              studentId={student.id}
                              date={day.date}
                              currentMinutes={late?.minutes ?? null}
                              currentNote={late?.note ?? null}
                              onSave={handleSaveLate}
                              onRemove={handleRemoveLate}
                              onClose={() => setLatePopup(null)}
                            />
                          )}

                          {!isPresent && !isTogglingThis && !readOnly && (
                            <button
                              onClick={() => setExcusedPopup(isExcPopupOpen ? null : { studentId: student.id, date: day.date })}
                              className={`w-6 h-4 rounded-md flex items-center justify-center transition-all text-[9px] font-medium ${isExcused
                                  ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700"
                                  : "bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-700"
                                }`}
                              title={t("attendance.reason_title")}
                            >
                              <Info size={9} />
                            </button>
                          )}

                          {/* Excused Popup */}
                          {isExcPopupOpen && (
                            <ExcusedPopup
                              studentId={student.id}
                              date={day.date}
                              currentReason={exc?.reason ?? null}
                              onSave={handleSaveExcused}
                              onRemove={handleRemoveExcused}
                              onClose={() => setExcusedPopup(null)}
                            />
                          )}

                          {/* HW Input */}
                          <div className="mt-1 flex items-center justify-center">
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={hwVal}
                              disabled={readOnly}
                              onChange={(e) => handleHwChange(student.id, day.date, e.target.value)}
                              className="w-10 h-5 text-center text-[10px] font-bold rounded-md bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-400 placeholder:text-[9px] disabled:opacity-50 disabled:cursor-not-allowed"
                              title={t("attendance.hw")}
                            />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`text-sm font-bold ${getPercentageColor(pct)}`}
                    >
                      {pct}%
                    </span>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                      {presentCount}/{weekDays.length}
                    </p>
                    {totalLateMinutes > 0 && (
                      <p className="text-[10px] font-semibold text-amber-500 dark:text-amber-400 mt-0.5 flex items-center justify-center gap-0.5">
                        <Clock size={9} />
                        {totalLateMinutes} {t("attendance.min")}
                      </p>
                    )}
                    {excusedCount > 0 && (
                      <p className="text-[10px] font-semibold text-red-500 dark:text-red-400 mt-0.5 flex items-center justify-center gap-0.5">
                        <Info size={9} />
                        {excusedCount} {t("attendance.excused").toLowerCase()}
                      </p>
                    )}
                    <p className="text-[10px] font-semibold text-purple-500 dark:text-purple-400 mt-0.5 flex items-center justify-center gap-0.5">
                      <BookOpen size={9} />
                      {totalHw} {t("attendance.hw").toLowerCase()}
                    </p>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
