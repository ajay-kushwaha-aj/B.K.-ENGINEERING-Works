"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  TrendingUp,
} from "lucide-react";
import { WorkerType, AttendanceType } from "shared";

const EmployeeAvatar = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg viewBox="0 0 100 100" className={className} width={size} height={size} fill="currentColor">
    <path d="M10,100 C10,75 25,65 35,65 L65,65 C75,65 90,75 90,100 Z" fill="currentColor" opacity="0.9" />
    <path d="M25,100 L35,65 L45,100 Z" fill="#ffffff" opacity="0.2" />
    <path d="M75,100 L65,65 L55,100 Z" fill="#ffffff" opacity="0.2" />
    <rect x="42" y="55" width="16" height="12" fill="currentColor" opacity="0.7" />
    <circle cx="50" cy="45" r="15" fill="currentColor" />
    <path d="M25,40 C25,20 75,20 75,40 Z" fill="currentColor" />
    <path d="M20,40 C20,38 80,38 80,40 C80,42 20,42 20,40 Z" fill="currentColor" />
    <rect x="46" y="22" width="8" height="15" rx="3" fill="#ffffff" opacity="0.3" />
  </svg>
);

/** Format a local Date to YYYY-MM-DD string (no timezone shift) */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse the API date (ISO string) back to local YYYY-MM-DD */
function apiDateToLocalStr(apiDate: string | Date): string {
  const d = new Date(apiDate);
  // Use local year/month/day to avoid UTC shift
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; border: string; text: string; dot: string }> = {
  PRESENT:  { label: "Present",  bg: "bg-emerald-50 dark:bg-emerald-500/10",  border: "border-emerald-300 dark:border-emerald-500/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  HALF_DAY: { label: "Half Day", bg: "bg-amber-50 dark:bg-amber-500/10",    border: "border-amber-300 dark:border-amber-500/30",   text: "text-amber-700 dark:text-amber-400",   dot: "bg-amber-500"  },
  ABSENT:   { label: "Absent",   bg: "bg-red-50 dark:bg-red-500/10",        border: "border-red-200 dark:border-red-500/20",       text: "text-red-600 dark:text-red-400",       dot: "bg-red-500"    },
  LEAVE:    { label: "Leave",    bg: "bg-blue-50 dark:bg-blue-500/10",      border: "border-blue-300 dark:border-blue-500/30",     text: "text-blue-700 dark:text-blue-400",     dot: "bg-blue-500"   },
  HOLIDAY:  { label: "Holiday",  bg: "bg-purple-50 dark:bg-purple-500/10",  border: "border-purple-300 dark:border-purple-500/30", text: "text-purple-700 dark:text-purple-400", dot: "bg-purple-500" },
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState<T>(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function WorkerDetailPage() {
  const { id } = useParams() as { id: string };
  const [worker, setWorker] = React.useState<WorkerType | null>(null);
  const [attendance, setAttendance] = React.useState<AttendanceType[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAttLoading, setIsAttLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const today = new Date();
  const [month, setMonth] = React.useState(today.getMonth() + 1);
  const [year, setYear] = React.useState(today.getFullYear());

  // Track per-day save states: "idle" | "saving" | "saved" | "error"
  const [saveStatus, setSaveStatus] = React.useState<Record<string, "idle" | "saving" | "saved" | "error">>({});

  // Local overtime edits (pending save), keyed by YYYY-MM-DD
  const [localOT, setLocalOT] = React.useState<Record<string, number>>({});
  // Track which OT keys have pending debounced saves
  const [pendingOT, setPendingOT] = React.useState<Record<string, number>>({});

  // ─── Fetch worker ─────────────────────────────────────────────
  const fetchWorker = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/workers/${id}`);
      const data = await res.json();
      if (res.ok) setWorker(data);
      else throw new Error(data.error || "Failed to load worker profile");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // ─── Fetch attendance ─────────────────────────────────────────
  const fetchAttendance = React.useCallback(async () => {
    setIsAttLoading(true);
    try {
      const res = await fetch(`/api/workers/${id}/attendance?month=${month}&year=${year}`);
      const data = await res.json();
      if (res.ok) {
        setAttendance(data);
        // Seed localOT from fetched records
        const otMap: Record<string, number> = {};
        data.forEach((r: AttendanceType) => {
          const key = apiDateToLocalStr(r.date as string);
          otMap[key] = Number(r.overtimeHours) || 0;
        });
        setLocalOT(otMap);
        setPendingOT({});
      } else {
        throw new Error(data.error || "Failed to load attendance");
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsAttLoading(false);
    }
  }, [id, month, year]);

  React.useEffect(() => { fetchWorker(); }, [fetchWorker]);
  React.useEffect(() => {
    fetchAttendance();
    setSaveStatus({});
  }, [fetchAttendance]);

  // ─── Save one day's attendance ─────────────────────────────────
  const saveDayAttendance = React.useCallback(
    async (dateStr: string, status: string, overtimeHours: number) => {
      setSaveStatus(prev => ({ ...prev, [dateStr]: "saving" }));
      try {
        // Send date as "YYYY-MM-DDT00:00:00" in local time to avoid UTC shift
        const res = await fetch(`/api/workers/${id}/attendance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: `${dateStr}T00:00:00`,
            status,
            overtimeHours,
          }),
        });
        if (!res.ok) throw new Error("Failed to save");
        const savedData = await res.json();

        setAttendance(prev => {
          const idx = prev.findIndex(a => apiDateToLocalStr(a.date as string) === dateStr);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = savedData;
            return updated;
          }
          return [...prev, savedData];
        });

        setSaveStatus(prev => ({ ...prev, [dateStr]: "saved" }));
        setTimeout(() => setSaveStatus(prev => ({ ...prev, [dateStr]: "idle" })), 1500);
      } catch (err) {
        console.error(err);
        setSaveStatus(prev => ({ ...prev, [dateStr]: "error" }));
      }
    },
    [id]
  );

  // ─── Debounced OT saves ───────────────────────────────────────
  // We store pending OT updates and debounce per key using a ref
  const otTimers = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const handleOTChange = (dateStr: string, value: number, currentStatus: string) => {
    setLocalOT(prev => ({ ...prev, [dateStr]: value }));
    clearTimeout(otTimers.current[dateStr]);
    otTimers.current[dateStr] = setTimeout(() => {
      saveDayAttendance(dateStr, currentStatus, value);
    }, 800);
  };

  // ─── Month navigation ─────────────────────────────────────────
  const handleMonthChange = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (month === 1) { setMonth(12); setYear(y => y - 1); }
      else setMonth(m => m - 1);
    } else {
      if (month === 12) { setMonth(1); setYear(y => y + 1); }
      else setMonth(m => m + 1);
    }
  };

  // ─── Calendar helpers ─────────────────────────────────────────
  const getDaysInMonth = (m: number, y: number): Date[] => {
    const days: Date[] = [];
    const date = new Date(y, m - 1, 1);
    while (date.getMonth() === m - 1) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const days = getDaysInMonth(month, year);
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=Sun

  // Map attendance by local date string for O(1) lookup
  const attMap = React.useMemo(() => {
    const m: Record<string, AttendanceType> = {};
    attendance.forEach(a => { m[apiDateToLocalStr(a.date as string)] = a; });
    return m;
  }, [attendance]);

  // ─── Stats ───────────────────────────────────────────────────
  const stats = React.useMemo(() => {
    let present = 0, halfDay = 0, absent = 0, leave = 0, holiday = 0, totalOT = 0;
    attendance.forEach(a => {
      if (a.status === "PRESENT")  present++;
      if (a.status === "HALF_DAY") halfDay++;
      if (a.status === "ABSENT")   absent++;
      if (a.status === "LEAVE")    leave++;
      if (a.status === "HOLIDAY")  holiday++;
      totalOT += Number(a.overtimeHours) || 0;
    });
    const effectiveDays = present + halfDay * 0.5;
    return { present, halfDay, absent, leave, holiday, totalOT, effectiveDays };
  }, [attendance]);

  const todayStr = toLocalDateStr(today);

  // ─── Loading / Error states ───────────────────────────────────
  if (isLoading) {
    return (
      <Navigation>
        <div className="flex items-center justify-center py-40">
          <Loader2 className="animate-spin text-secondary" size={40} />
        </div>
      </Navigation>
    );
  }

  if (errorMsg || !worker) {
    return (
      <Navigation>
        <div className="max-w-xl mx-auto text-center py-20">
          <AlertCircle className="mx-auto text-danger mb-4" size={48} />
          <h2 className="text-xl font-bold text-foreground">Error Loading Profile</h2>
          <p className="text-muted-foreground mt-2">{errorMsg || "Employee details not found."}</p>
          <Link href="/workers" className="inline-block mt-6">
            <Button className="flex items-center gap-2"><ArrowLeft size={16} /> Back to Employees</Button>
          </Link>
        </div>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <div className="space-y-6">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <Link href="/workers">
            <Button variant="outline" size="sm" className="p-2 cursor-pointer">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Employee Profile: {worker.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Joined {new Date(worker.joiningDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* ── Profile + Banking ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border shadow-sm">
            <CardHeader className="flex flex-row items-center gap-4 border-b border-border/60 pb-4">
              {worker.photoUrl ? (
                <img src={worker.photoUrl} alt={worker.name} className="w-16 h-16 rounded-full object-cover border-2 border-[#1E3A8A]" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 overflow-hidden">
                  <EmployeeAvatar size={56} className="w-full h-full p-0.5" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-foreground">{worker.name}</h2>
                <p className="text-sm text-muted-foreground font-medium">{worker.designation} • {worker.department || "General"}</p>
                <span className={`inline-flex px-2.5 py-1 mt-1 rounded-full text-xs font-extrabold border ${
                  worker.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : worker.status === "ON_LEAVE" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400"
                  : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                }`}>
                  {worker.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Phone size={16} className="text-secondary" />
                  <a href={`tel:${worker.phone}`} className="text-foreground font-semibold hover:text-secondary hover:underline">{worker.phone}</a>
                </div>
                {worker.email && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Mail size={16} className="text-secondary" />
                    <span className="text-foreground">{worker.email}</span>
                  </div>
                )}
                {worker.address && (
                  <div className="flex items-start gap-2.5 text-muted-foreground">
                    <MapPin size={16} className="text-secondary mt-0.5" />
                    <span className="text-foreground">{worker.address}</span>
                  </div>
                )}
                {worker.fatherName && (
                  <div className="text-xs text-muted-foreground pl-6">Father: <span className="text-foreground font-medium">{worker.fatherName}</span></div>
                )}
              </div>
              <div className="space-y-3 border-t md:border-t-0 md:border-l border-border/60 pt-3 md:pt-0 md:pl-4">
                <div className="flex justify-between"><span className="text-muted-foreground">Salary Term:</span><span className="font-semibold uppercase">{worker.salaryType}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Basic Pay Rate:</span><span className="font-bold">₹{Number(worker.basicSalary).toLocaleString("en-IN")}</span></div>
                {worker.aadharNumber && <div className="flex justify-between"><span className="text-muted-foreground">Aadhar:</span><span className="font-mono">{worker.aadharNumber}</span></div>}
                {worker.panNumber && <div className="flex justify-between"><span className="text-muted-foreground">PAN:</span><span className="font-mono">{worker.panNumber}</span></div>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="bg-[#1E3A8A]/5 border-b border-border/60 pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-1.5">
                <CreditCard size={16} /> Banking Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs space-y-2.5">
              {[
                { label: "Bank Name", value: worker.bankName },
                { label: "Account No.", value: worker.bankAccount },
                { label: "IFSC Code", value: worker.ifsc },
                { label: "UPI ID", value: worker.upiId },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between pb-1.5 border-b border-border/40 last:border-0">
                  <span className="text-muted-foreground">{label}:</span>
                  <span className="font-semibold text-foreground font-mono">{value || "—"}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ── Attendance Tracker ──────────────────────────────────── */}
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4 flex-wrap gap-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="text-secondary" size={20} />
              Daily Attendance — {MONTH_NAMES[month - 1]} {year}
            </CardTitle>

            {/* Month Selector */}
            <div className="flex items-center gap-2">
              <button onClick={() => handleMonthChange("prev")} className="p-1.5 border border-border rounded-lg bg-card text-foreground hover:bg-muted cursor-pointer transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-bold text-foreground min-w-[130px] text-center">
                {MONTH_NAMES[month - 1]} {year}
              </span>
              <button onClick={() => handleMonthChange("next")} className="p-1.5 border border-border rounded-lg bg-card text-foreground hover:bg-muted cursor-pointer transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </CardHeader>

          <CardContent className="pt-5">
            {isAttLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-secondary" size={32} />
              </div>
            ) : (
              <div className="space-y-5">

                {/* ── Monthly Stats ────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: "Present",     value: stats.present,       color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" },
                    { label: "Half Day",    value: stats.halfDay,       color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" },
                    { label: "Absent",      value: stats.absent,        color: "text-red-600",     bg: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20" },
                    { label: "Leave",       value: stats.leave,         color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20" },
                    { label: "Holidays",    value: stats.holiday,       color: "text-purple-600",  bg: "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20" },
                    { label: "OT Hours",    value: `${stats.totalOT}h`, color: "text-[#D4AF37]",   bg: "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20" },
                  ].map(s => (
                    <div key={s.label} className={`flex flex-col items-center p-3 rounded-xl border ${s.bg}`}>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">{s.label}</p>
                      <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Effective working days line */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                  <TrendingUp size={15} className="text-secondary" />
                  <span>Effective working days this month: <span className="font-bold text-foreground">{stats.effectiveDays}</span></span>
                </div>

                {/* ── Calendar Grid ────────────────────────── */}
                <div className="border border-border rounded-2xl overflow-hidden">
                  {/* Weekday header row */}
                  <div className="grid grid-cols-7 bg-muted/50 border-b border-border">
                    {WEEKDAYS.map(wd => (
                      <div key={wd} className="py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {wd}
                      </div>
                    ))}
                  </div>

                  {/* Calendar cells */}
                  <div className="grid grid-cols-7">
                    {/* Empty cells before first day */}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="min-h-[120px] border-r border-b border-border/50 bg-muted/20 last:border-r-0" />
                    ))}

                    {days.map((day, idx) => {
                      const dateStr = toLocalDateStr(day);
                      const record = attMap[dateStr];
                      const status = record?.status || "ABSENT";
                      const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ABSENT;
                      const ot = localOT[dateStr] ?? (Number(record?.overtimeHours) || 0);
                      const saveState = saveStatus[dateStr] || "idle";
                      const isToday = dateStr === todayStr;
                      const isFuture = day > today;
                      // Determine column position for border-r suppression
                      const colPosition = (firstDayOfWeek + idx) % 7;
                      const isLastInRow = colPosition === 6;
                      const notes = record?.notes || "";

                      return (
                        <div
                          key={dateStr}
                          className={`min-h-[120px] p-2 border-b border-border/50 transition-all ${isLastInRow ? "" : "border-r border-border/50"} ${cfg.bg} ${isToday ? "ring-2 ring-inset ring-secondary/60" : ""} ${isFuture ? "opacity-50" : ""}`}
                        >
                          {/* Day number + save state */}
                          <div className="flex items-start justify-between mb-1.5">
                            <span className={`text-sm font-bold leading-none ${isToday ? "text-secondary" : "text-foreground"}`}>
                              {day.getDate()}
                              {isToday && <span className="ml-1 text-[9px] font-bold text-secondary uppercase tracking-wider">Today</span>}
                            </span>
                            <span>
                              {saveState === "saving" && <Loader2 className="animate-spin text-muted-foreground" size={12} />}
                              {saveState === "saved"  && <CheckCircle2 className="text-emerald-500" size={12} />}
                              {saveState === "error"  && <AlertCircle className="text-red-500" size={12} />}
                            </span>
                          </div>

                          {/* Status badge */}
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border mb-2 ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>

                          {/* Status select */}
                          <select
                            value={status}
                            disabled={isFuture}
                            onChange={e => {
                              const newStatus = e.target.value;
                              saveDayAttendance(dateStr, newStatus, ot);
                            }}
                            className="w-full text-[11px] h-7 rounded-md border border-border bg-background/80 px-1.5 focus:outline-none cursor-pointer font-semibold mb-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="PRESENT">Present</option>
                            <option value="HALF_DAY">Half Day</option>
                            <option value="ABSENT">Absent</option>
                            <option value="LEAVE">Leave</option>
                            <option value="HOLIDAY">Holiday</option>
                          </select>

                          {/* Overtime input */}
                          <div className="flex items-center gap-1">
                            <Clock size={10} className="text-muted-foreground shrink-0" />
                            <span className="text-[10px] text-muted-foreground">OT:</span>
                            <input
                              type="number"
                              min="0"
                              max="12"
                              step="0.5"
                              disabled={isFuture}
                              value={ot}
                              onFocus={e => e.target.select()}
                              onChange={e => handleOTChange(dateStr, parseFloat(e.target.value) || 0, status)}
                              className="text-[11px] h-6 w-12 text-center rounded border border-border bg-background/80 px-1 focus:outline-none font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className="text-[10px] text-muted-foreground">hrs</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Fill trailing empty cells to complete last row */}
                    {(() => {
                      const totalCells = firstDayOfWeek + days.length;
                      const remainder = totalCells % 7;
                      if (remainder === 0) return null;
                      return Array.from({ length: 7 - remainder }).map((_, i) => (
                        <div key={`trail-${i}`} className="min-h-[120px] border-r border-b border-border/50 bg-muted/20 last:border-r-0" />
                      ));
                    })()}
                  </div>
                </div>

                {/* ── Legend ──────────────────────────────── */}
                <div className="flex flex-wrap gap-3 pt-1">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <span key={key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-secondary/40 bg-secondary/5 text-secondary">
                    <span className="w-2 h-2 rounded-full ring-2 ring-secondary/60 bg-secondary/20" />
                    Today
                  </span>
                </div>

              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Navigation>
  );
}
