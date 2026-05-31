import { AttendanceReport } from "@/types";
import { formatDMY } from "@/lib/dates";
import Logo from "@/components/ui/Logo";
import {
  Users,
  CalendarDays,
  Percent,
  UserCheck,
  UserX,
  Clock,
  Info,
  BookOpen,
} from "lucide-react";

/* ─── Helpers ─── */
function fmtDateTime(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(dt.getDate())}.${p(dt.getMonth() + 1)}.${dt.getFullYear()} · ${p(
    dt.getHours(),
  )}:${p(dt.getMinutes())}`;
}

function periodLabel(report: AttendanceReport): string {
  if (report.rangeStart && report.rangeEnd) {
    return report.rangeStart === report.rangeEnd
      ? formatDMY(report.rangeStart)
      : `${formatDMY(report.rangeStart)} — ${formatDMY(report.rangeEnd)}`;
  }
  if (report.period.from || report.period.to) {
    return `${formatDMY(report.period.from)} — ${formatDMY(report.period.to)}`;
  }
  return "Ҳамаи давра";
}

function rateTone(rate: number) {
  if (rate >= 80)
    return { text: "text-emerald-600", bar: "bg-emerald-500", soft: "bg-emerald-50", border: "border-emerald-200" };
  if (rate >= 60)
    return { text: "text-amber-600", bar: "bg-amber-500", soft: "bg-amber-50", border: "border-amber-200" };
  return { text: "text-red-600", bar: "bg-red-500", soft: "bg-red-50", border: "border-red-200" };
}

/* ─── Component ─── */
export default function AttendanceReportView({
  report,
}: {
  report: AttendanceReport;
}) {
  const s = report.summary;
  const avgTone = rateTone(s.avgRate);

  const stats = [
    { label: "Талабагон", value: s.totalStudents, icon: Users, accent: "text-indigo-500", card: "bg-white border-slate-200" },
    { label: "Ҷаласаҳо", value: s.totalSessions, icon: CalendarDays, accent: "text-slate-400", card: "bg-white border-slate-200" },
    { label: "Ҳузури миёна", value: `${s.avgRate}%`, icon: Percent, accent: avgTone.text, card: `${avgTone.soft} ${avgTone.border}`, valueClass: avgTone.text },
    { label: "Ҳозириҳо", value: s.present, icon: UserCheck, accent: "text-emerald-500", card: "bg-white border-slate-200", valueClass: "text-emerald-600" },
    { label: "Ғоибиҳо", value: s.absent, icon: UserX, accent: "text-slate-400", card: "bg-white border-slate-200", valueClass: "text-slate-600" },
    { label: "Сабабнок", value: s.excused, icon: Info, accent: "text-red-400", card: "bg-white border-slate-200", valueClass: "text-red-600" },
    { label: "Дер омадан", value: s.late, icon: Clock, accent: "text-amber-500", card: "bg-white border-slate-200", valueClass: "text-amber-600" },
    { label: "Масъалаҳо", value: s.hwSolved, icon: BookOpen, accent: "text-purple-500", card: "bg-white border-slate-200", valueClass: "text-purple-600" },
  ];

  const th =
    "px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700";

  return (
    <article className="report-paper bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-xl shadow-slate-300/40 p-6 sm:p-9 print:shadow-none print:rounded-none print:border-0 print:p-0">
      {/* ─── Header ─── */}
      <header className="flex items-start justify-between gap-4 border-b-2 border-indigo-600 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <Logo size={28} variant="inverted" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 leading-none">
              ҲИСОБОТИ ҲУЗУР
            </h1>
            <p className="text-xs text-slate-500 mt-1.5">
              Системаи қайди ҳузур · Student CRM
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Санаи таҳия
          </p>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            {fmtDateTime(report.generatedAt)}
          </p>
        </div>
      </header>

      {/* ─── Meta ─── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-3.5 mt-5">
        <Meta label="Гурӯҳ" value={report.group.name} />
        <Meta label="Ментор" value={report.mentor ?? "—"} />
        <Meta label="Давра" value={periodLabel(report)} />
        <Meta label="Шумораи ҷаласаҳо" value={String(s.totalSessions)} />
        {report.group.description && (
          <div className="col-span-2 sm:col-span-4">
            <Meta label="Тавсиф" value={report.group.description} />
          </div>
        )}
      </section>

      {/* ─── Summary cards ─── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 print:grid-cols-4 gap-2.5 mt-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border p-3 ${stat.card}`}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <stat.icon size={14} className={stat.accent} />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 leading-tight">
                {stat.label}
              </span>
            </div>
            <p
              className={`text-2xl font-extrabold leading-none ${
                stat.valueClass ?? "text-slate-900"
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      {/* ─── Detail ─── */}
      <section className="mt-7">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-indigo-600 rounded-full" />
          Натиҷаҳои талабагон
        </h2>

        {report.students.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">
            Дар ин гурӯҳ ҳоло талаба нест.
          </div>
        ) : (
          <>
            {s.totalSessions === 0 && (
              <p className="text-xs text-slate-400 italic mb-2.5">
                Дар ин давра ягон ҷаласа қайд нашудааст.
              </p>
            )}
            <div className="overflow-x-auto print:overflow-visible rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-indigo-50 border-b border-indigo-100">
                    <th className={`${th} text-center w-10`}>№</th>
                    <th className={`${th} text-left`}>Ному насаб</th>
                    <th className={`${th} text-center`}>Ҷаласа</th>
                    <th className={`${th} text-center`}>Ҳозир</th>
                    <th className={`${th} text-center`}>Ғоиб</th>
                    <th className={`${th} text-center`}>Саб.</th>
                    <th className={`${th} text-center`}>Дер</th>
                    <th className={`${th} text-center`}>Дер, дақ</th>
                    <th className={`${th} text-center`}>Масъала</th>
                    <th className={`${th} text-center`}>Ҳузур</th>
                  </tr>
                </thead>
                <tbody>
                  {report.students.map((row, i) => {
                    const tone = rateTone(row.rate);
                    return (
                      <tr
                        key={row.id}
                        className={`print:break-inside-avoid ${
                          i % 2 === 1 ? "bg-slate-50" : "bg-white"
                        }`}
                      >
                        <td className="px-3 py-2.5 text-center text-xs font-medium text-slate-400 border-b border-slate-100">
                          {i + 1}
                        </td>
                        <td className="px-3 py-2.5 border-b border-slate-100">
                          <p className="font-semibold text-slate-800">
                            {row.name}
                          </p>
                          {row.phone && (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {row.phone}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center text-slate-500 border-b border-slate-100">
                          {row.sessions}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-emerald-600 border-b border-slate-100">
                          {row.present}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-center font-semibold border-b border-slate-100 ${
                            row.absent > 0 ? "text-slate-600" : "text-slate-300"
                          }`}
                        >
                          {row.absent}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-center font-semibold border-b border-slate-100 ${
                            row.excused > 0 ? "text-red-600" : "text-slate-300"
                          }`}
                        >
                          {row.excused}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-center font-semibold border-b border-slate-100 ${
                            row.late > 0 ? "text-amber-600" : "text-slate-300"
                          }`}
                        >
                          {row.late}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-center border-b border-slate-100 ${
                            row.lateMinutes > 0
                              ? "text-amber-600 font-medium"
                              : "text-slate-300"
                          }`}
                        >
                          {row.lateMinutes > 0 ? row.lateMinutes : "—"}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-center font-semibold border-b border-slate-100 ${
                            row.hwSolved > 0 ? "text-purple-600" : "text-slate-300"
                          }`}
                        >
                          {row.hwSolved > 0 ? row.hwSolved : "—"}
                        </td>
                        <td className="px-3 py-2.5 border-b border-slate-100">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-sm font-bold ${tone.text}`}>
                              {row.rate}%
                            </span>
                            <div className="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${tone.bar}`}
                                style={{ width: `${row.rate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {report.students.length > 1 && (
                  <tfoot>
                    <tr className="bg-indigo-50/70 border-t-2 border-indigo-100 font-bold">
                      <td
                        colSpan={2}
                        className="px-3 py-2.5 text-xs uppercase tracking-wide text-indigo-700"
                      >
                        Ҳамагӣ
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-500">
                        {s.totalSessions}
                      </td>
                      <td className="px-3 py-2.5 text-center text-emerald-700">
                        {s.present}
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-700">
                        {s.absent}
                      </td>
                      <td className="px-3 py-2.5 text-center text-red-700">
                        {s.excused}
                      </td>
                      <td className="px-3 py-2.5 text-center text-amber-700">
                        {s.late}
                      </td>
                      <td className="px-3 py-2.5 text-center text-amber-700">
                        {s.lateMinutes > 0 ? s.lateMinutes : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-center text-purple-700">
                        {s.hwSolved > 0 ? s.hwSolved : "—"}
                      </td>
                      <td className={`px-3 py-2.5 text-center ${avgTone.text}`}>
                        {s.avgRate}%
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}
      </section>

      {/* ─── Footer ─── */}
      <footer className="mt-7 pt-3.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
        <span>Student CRM — Системаи қайди ҳузур</span>
        <span>Таҳия шуд: {fmtDateTime(report.generatedAt)}</span>
      </footer>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5 break-words">
        {value}
      </p>
    </div>
  );
}
