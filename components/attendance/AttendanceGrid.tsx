"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Student, WeekDay } from "@/types";
import { attendanceApi } from "@/lib/api";
import { getStudentInitials, formatStudentName } from "@/lib/formatters";
import { Check, X, Clock } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import toast from "react-hot-toast";

interface AttendanceGridProps {
  students: Student[];
  weekDays: WeekDay[];
  groupId: number;
}

type AttendanceMap = Record<string, boolean>;
type LateMap = Record<string, { minutes: number | null; note: string | null }>;

function makeKey(studentId: number, date: string) {
  return `${studentId}_${date}`;
}

function getAttendanceBtnClass(
  isToggling: boolean,
  isPresent: boolean,
  isLate: boolean,
): string {
  if (isToggling) return "opacity-50 cursor-wait bg-gray-100 dark:bg-slate-800";
  if (isPresent && isLate)
    return "bg-amber-400 hover:bg-amber-500 shadow-sm shadow-amber-200 dark:shadow-amber-900/30";
  if (isPresent)
    return "bg-green-500 hover:bg-green-600 shadow-sm shadow-green-200 dark:shadow-green-900/30";
  return "bg-gray-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800";
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
      {/* Arrow */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 border-t border-l border-gray-200 dark:border-slate-700 rotate-45" />

      <div className="relative">
        <p className="text-xs font-bold text-gray-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
          <Clock size={13} className="text-amber-500" />
          Дер омадан
        </p>

        {/* Minutes */}
        <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
          Чанд дақиқа дер?
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
          <span className="text-xs text-gray-400 dark:text-slate-500">дақ</span>
        </div>

        {/* Quick buttons */}
        <div className="flex gap-1.5 mb-3">
          {[5, 10, 15, 30].map((m) => (
            <button
              key={m}
              onClick={() => setMinutes(m)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                minutes === m
                  ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                  : "bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600"
              }`}
            >
              {m}&apos;
            </button>
          ))}
        </div>

        {/* Note */}
        <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
          Сабаб (ихтиёрӣ)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="мас: роҳбанд..."
          className="w-full h-8 px-3 text-sm rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 mb-3"
        />

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onSave(studentId, date, minutes, note)}
            className="flex-1 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-sm"
          >
            Сабт кунед
          </button>
          {currentMinutes != null && (
            <button
              onClick={() => onRemove(studentId, date)}
              className="py-2 px-3 text-xs font-medium rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 dark:text-slate-400 hover:text-red-500 transition-colors"
            >
              Нест кунед
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
}: AttendanceGridProps) {
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [lateData, setLateData] = useState<LateMap>({});
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [latePopup, setLatePopup] = useState<{ studentId: number; date: string } | null>(null);

  const weekStartDate = weekDays[0]?.date ?? "";

  const loadAttendance = useCallback(async () => {
    if (!weekStartDate || !students.length) return;
    setLoading(true);
    try {
      const records = await attendanceApi.getWeekly(groupId, weekStartDate);
      const map: AttendanceMap = {};
      const late: LateMap = {};
      records.forEach((r) => {
        const key = makeKey(r.studentId, r.date);
        map[key] = r.present;
        late[key] = {
          minutes: r.lateMinutes ?? null,
          note: r.lateNote ?? null,
        };
      });
      setAttendance(map);
      setLateData(late);
    } catch {
      toast.error("Маълумот бор нашуд");
    } finally {
      setLoading(false);
    }
  }, [groupId, weekStartDate, students.length]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const toggle = async (studentId: number, date: string) => {
    const key = makeKey(studentId, date);
    const current = attendance[key] ?? false;
    const next = !current;

    setToggling(key);
    setAttendance((prev) => ({ ...prev, [key]: next }));

    // If toggling to absent, clear late data
    if (!next) {
      setLateData((prev) => ({ ...prev, [key]: { minutes: null, note: null } }));
    }

    try {
      await attendanceApi.upsert({
        studentId,
        date,
        present: next,
        lateMinutes: next ? (lateData[key]?.minutes ?? null) : null,
        lateNote: next ? (lateData[key]?.note ?? null) : null,
      });
    } catch {
      setAttendance((prev) => ({ ...prev, [key]: current }));
      toast.error("Сабт нашуд");
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
      });
      toast.success(`${minutes} дақиқа дер сабт шуд`);
    } catch {
      setLateData((prev) => ({ ...prev, [key]: prevLate }));
      toast.error("Сабт нашуд");
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
      });
      toast.success("Дер бардошта шуд");
    } catch {
      setLateData((prev) => ({ ...prev, [key]: prevLate }));
      toast.error("Хатогӣ рӯй дод");
    }
  };

  const markAllPresent = async (date: string) => {
    const records = students.map((s) => ({ studentId: s.id, present: true }));
    try {
      await attendanceApi.bulkUpsert({ date, records });
      const updates: AttendanceMap = {};
      students.forEach((s) => {
        updates[makeKey(s.id, date)] = true;
      });
      setAttendance((prev) => ({ ...prev, ...updates }));
      toast.success("Ҳама ҳозир қайд шуд");
    } catch {
      toast.error("Хатогӣ рӯй дод");
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
    return { present, absent: students.length - present, late: lateCount };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!students.length) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 dark:text-slate-500 text-sm">
        Ин гурӯҳда талаба нест
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider bg-gray-50 dark:bg-slate-800/50 rounded-tl-xl min-w-[180px] sticky left-0">
              Талаба
            </th>
            {weekDays.map((day) => {
              const stats = getStats(day.date);
              return (
                <th
                  key={day.date}
                  className={`py-3 px-2 text-center min-w-[80px] ${
                    day.isToday
                      ? "bg-indigo-50 dark:bg-indigo-900/20"
                      : "bg-gray-50 dark:bg-slate-800/50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={`text-xs font-bold uppercase tracking-wide ${
                        day.isToday
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-gray-500 dark:text-slate-400"
                      }`}
                    >
                      {day.label}
                    </span>
                    {day.isToday && (
                      <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-medium">
                        Имрӯз
                      </span>
                    )}
                    <div className="flex gap-1 mt-0.5">
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                        {stats.present}✓
                      </span>
                      {stats.late > 0 && (
                        <span className="text-[10px] text-amber-500 dark:text-amber-400 font-medium">
                          {stats.late}⏱
                        </span>
                      )}
                      <span className="text-[10px] text-red-400 dark:text-red-500 font-medium">
                        {stats.absent}✗
                      </span>
                    </div>
                    <button
                      onClick={() => markAllPresent(day.date)}
                      className="text-[10px] text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors mt-0.5"
                    >
                      Ҳама ҳозир
                    </button>
                  </div>
                </th>
              );
            })}
            <th className="py-3 px-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider bg-gray-50 dark:bg-slate-800/50 rounded-tr-xl min-w-[90px]">
              Хулоса
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
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

              return (
                <tr
                  key={student.id}
                  className={`hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors ${
                    idx % 2 === 0
                      ? "bg-white dark:bg-slate-900"
                      : "bg-gray-50/50 dark:bg-slate-800/30"
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

                    return (
                      <td
                        key={day.date}
                        className={`py-3 px-2 text-center ${
                          day.isToday
                            ? "bg-indigo-50/40 dark:bg-indigo-900/10"
                            : ""
                        }`}
                      >
                        <div className="relative inline-flex flex-col items-center gap-1">
                          <button
                            onClick={() => toggle(student.id, day.date)}
                            disabled={isTogglingThis}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto transition-all duration-150 ${getAttendanceBtnClass(isTogglingThis, isPresent, isLate)}`}
                            title={isLate ? `${late?.minutes} дақ дер — ${late?.note || "сабаб нест"}` : undefined}
                          >
                            {isPresent ? (
                              isLate ? (
                                <span className="text-[11px] font-bold text-white leading-none">
                                  {late?.minutes}&apos;
                                </span>
                              ) : (
                                <Check
                                  size={16}
                                  className="text-white"
                                  strokeWidth={3}
                                />
                              )
                            ) : (
                              <X
                                size={14}
                                className="text-gray-400 dark:text-slate-500"
                              />
                            )}
                          </button>

                          {/* Late button - only show when present */}
                          {isPresent && !isTogglingThis && (
                            <button
                              onClick={() => setLatePopup(isPopupOpen ? null : { studentId: student.id, date: day.date })}
                              className={`w-6 h-4 rounded-md flex items-center justify-center transition-all text-[9px] font-medium ${
                                isLate
                                  ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700"
                                  : "bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-gray-200 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-700"
                              }`}
                              title="Дер омадан қайд кунед"
                            >
                              <Clock size={9} />
                            </button>
                          )}

                          {/* Late Popup */}
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
                        {totalLateMinutes} дақ
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
