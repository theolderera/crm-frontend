"use client";

import { useState, useEffect, useCallback } from "react";
import { Student, WeekDay } from "@/types";
import { attendanceApi } from "@/lib/api";
import { getStudentInitials, formatStudentName } from "@/lib/formatters";
import { Check, X } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import toast from "react-hot-toast";

interface AttendanceGridProps {
  students: Student[];
  weekDays: WeekDay[];
  groupId: number;
}

type AttendanceMap = Record<string, boolean>;

function makeKey(studentId: number, date: string) {
  return `${studentId}_${date}`;
}

function getAttendanceBtnClass(
  isToggling: boolean,
  isPresent: boolean,
): string {
  if (isToggling) return "opacity-50 cursor-wait bg-gray-100 dark:bg-slate-800";
  if (isPresent)
    return "bg-green-500 hover:bg-green-600 shadow-sm shadow-green-200 dark:shadow-green-900/30";
  return "bg-gray-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800";
}

function getPercentageColor(pct: number): string {
  if (pct >= 80) return "text-green-600 dark:text-green-400";
  if (pct >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-500 dark:text-red-400";
}

export default function AttendanceGrid({
  students,
  weekDays,
  groupId,
}: AttendanceGridProps) {
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const weekStartDate = weekDays[0]?.date ?? "";

  const loadAttendance = useCallback(async () => {
    if (!weekStartDate || !students.length) return;
    setLoading(true);
    try {
      const records = await attendanceApi.getWeekly(groupId, weekStartDate);
      const map: AttendanceMap = {};
      records.forEach((r) => {
        map[makeKey(r.studentId, r.date)] = r.present;
      });
      setAttendance(map);
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

    try {
      await attendanceApi.upsert({ studentId, date, present: next });
    } catch {
      setAttendance((prev) => ({ ...prev, [key]: current }));
      toast.error("Сабт нашуд");
    } finally {
      setToggling(null);
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
    return { present, absent: students.length - present };
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
            <th className="py-3 px-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider bg-gray-50 dark:bg-slate-800/50 rounded-tr-xl min-w-[70px]">
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

                    return (
                      <td
                        key={day.date}
                        className={`py-3 px-2 text-center ${
                          day.isToday
                            ? "bg-indigo-50/40 dark:bg-indigo-900/10"
                            : ""
                        }`}
                      >
                        <button
                          onClick={() => toggle(student.id, day.date)}
                          disabled={isTogglingThis}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto transition-all duration-150 ${getAttendanceBtnClass(isTogglingThis, isPresent)}`}
                        >
                          {isPresent ? (
                            <Check
                              size={16}
                              className="text-white"
                              strokeWidth={3}
                            />
                          ) : (
                            <X
                              size={14}
                              className="text-gray-400 dark:text-slate-500"
                            />
                          )}
                        </button>
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
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
