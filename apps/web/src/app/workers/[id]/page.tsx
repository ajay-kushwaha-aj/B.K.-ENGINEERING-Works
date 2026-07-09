"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
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
  HardHat, 
  User as UserIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { WorkerType, AttendanceType } from "shared";

const EmployeeAvatar = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className} 
    width={size} 
    height={size} 
    fill="currentColor"
  >
    {/* Shoulders / Vest */}
    <path d="M10,100 C10,75 25,65 35,65 L65,65 C75,65 90,75 90,100 Z" fill="currentColor" opacity="0.9" />
    
    {/* High-Vis Vest Stripes */}
    <path d="M25,100 L35,65 L45,100 Z" fill="#ffffff" opacity="0.2" />
    <path d="M75,100 L65,65 L55,100 Z" fill="#ffffff" opacity="0.2" />

    {/* Neck */}
    <rect x="42" y="55" width="16" height="12" fill="currentColor" opacity="0.7" />

    {/* Face/Head */}
    <circle cx="50" cy="45" r="15" fill="currentColor" />

    {/* Hard Hat Base */}
    <path d="M25,40 C25,20 75,20 75,40 Z" fill="currentColor" />
    {/* Hard Hat Brim */}
    <path d="M20,40 C20,38 80,38 80,40 C80,42 20,42 20,40 Z" fill="currentColor" />
    {/* Hard Hat Ridge */}
    <rect x="46" y="22" width="8" height="15" rx="3" fill="#ffffff" opacity="0.3" />
  </svg>
);

export default function WorkerDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [worker, setWorker] = React.useState<WorkerType | null>(null);
  const [attendance, setAttendance] = React.useState<AttendanceType[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAttLoading, setIsAttLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Calendar selectors
  const [month, setMonth] = React.useState(new Date().getMonth() + 1);
  const [year, setYear] = React.useState(new Date().getFullYear());
  
  // Status tracker for inline saves
  const [saveStatus, setSaveStatus] = React.useState<Record<string, "idle" | "saving" | "saved" | "error">>({});

  const fetchWorkerDetails = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/workers/${id}`);
      const data = await res.json();
      if (res.ok) {
        setWorker(data);
      } else {
        throw new Error(data.error || "Failed to load worker profile");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchAttendance = React.useCallback(async () => {
    setIsAttLoading(true);
    try {
      const res = await fetch(`/api/workers/${id}/attendance?month=${month}&year=${year}`);
      const data = await res.json();
      if (res.ok) {
        setAttendance(data);
      } else {
        throw new Error(data.error || "Failed to load attendance logs");
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsAttLoading(false);
    }
  }, [id, month, year]);

  React.useEffect(() => {
    fetchWorkerDetails();
  }, [fetchWorkerDetails]);

  React.useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleMonthChange = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (month === 1) {
        setMonth(12);
        setYear(year - 1);
      } else {
        setMonth(month - 1);
      }
    } else {
      if (month === 12) {
        setMonth(1);
        setYear(year + 1);
      } else {
        setMonth(month + 1);
      }
    }
    setSaveStatus({});
  };

  const getDaysInMonth = (m: number, y: number) => {
    const date = new Date(y, m - 1, 1);
    const days = [];
    while (date.getMonth() === m - 1) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const saveDayAttendance = async (date: Date, status: string, overtimeHours: number, notes?: string) => {
    const dateStr = date.toISOString();
    setSaveStatus(prev => ({ ...prev, [dateStr]: "saving" }));

    try {
      const res = await fetch(`/api/workers/${id}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: date.toISOString(),
          status,
          overtimeHours,
          notes,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      const savedData = await res.json();
      
      // Update local state array
      setAttendance(prev => {
        const inputDateStr = new Date(date).toDateString();
        const idx = prev.findIndex(a => new Date(a.date).toDateString() === inputDateStr);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = savedData;
          return updated;
        } else {
          return [...prev, savedData];
        }
      });

      setSaveStatus(prev => ({ ...prev, [dateStr]: "saved" }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [dateStr]: "idle" }));
      }, 1500);
    } catch (err) {
      console.error(err);
      setSaveStatus(prev => ({ ...prev, [dateStr]: "error" }));
    }
  };

  const days = getDaysInMonth(month, year);
  
  // Find attendance log for a specific date
  const getDayRecord = (date: Date) => {
    const dateStr = date.toDateString();
    return attendance.find(a => new Date(a.date).toDateString() === dateStr);
  };

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
        <div className="flex items-center gap-4">
          <Link href="/workers">
            <Button variant="outline" size="sm" className="p-2 cursor-pointer">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Employee Profile: {worker.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Joined {new Date(worker.joiningDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Worker Card details & Quick statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info */}
          <Card className="lg:col-span-2 border-border shadow-sm">
            <CardHeader className="flex flex-row items-center gap-4 border-b border-border/60 pb-4">
              {worker.photoUrl ? (
                <img 
                  src={worker.photoUrl} 
                  alt={worker.name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#1E3A8A]"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 overflow-hidden">
                  <EmployeeAvatar size={56} className="w-full h-full p-0.5" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-foreground">{worker.name}</h2>
                <p className="text-sm text-muted-foreground font-medium">{worker.designation} • {worker.department || "General"}</p>
                <div className="mt-1">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-2xs font-extrabold border ${
                    worker.status === "ACTIVE"
                      ? "bg-[#e6f4ea] text-[#137333] border-[#ceead6] dark:bg-[#137333]/20 dark:text-[#34d399] dark:border-[#10b981]/30"
                      : worker.status === "ON_LEAVE"
                      ? "bg-[#fef7e0] text-[#b06000] border-[#feebc8] dark:bg-[#b06000]/20 dark:text-[#fbbf24] dark:border-[#f59e0b]/30"
                      : "bg-[#f1f3f4] text-[#3c4043] border-[#dadce0] dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  }`}>
                    {worker.status}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Phone size={16} className="text-secondary" />
                  <a href={`tel:${worker.phone}`} className="text-foreground font-semibold hover:text-secondary hover:underline transition-colors flex items-center gap-1 cursor-pointer">
                    {worker.phone}
                  </a>
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
                  <div className="text-xs text-muted-foreground pl-6">
                    Father: <span className="text-foreground font-medium">{worker.fatherName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t md:border-t-0 md:border-l border-border/60 pt-3 md:pt-0 md:pl-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Salary Term:</span>
                  <span className="font-semibold text-foreground uppercase">{worker.salaryType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Basic Pay Rate:</span>
                  <span className="font-bold text-foreground">₹{Number(worker.basicSalary).toLocaleString("en-IN")}</span>
                </div>
                {worker.aadharNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aadhar Number:</span>
                    <span className="font-mono text-foreground">{worker.aadharNumber}</span>
                  </div>
                )}
                {worker.panNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PAN:</span>
                    <span className="font-mono text-foreground">{worker.panNumber}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Banking details */}
          <Card className="border-border shadow-sm">
            <CardHeader className="bg-[#1E3A8A]/5 border-b border-border/60 pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-1.5">
                <CreditCard size={16} /> Banking Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs space-y-2.5">
              <div className="flex justify-between pb-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Bank Name:</span>
                <span className="font-semibold text-foreground">{worker.bankName || "—"}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Account Number:</span>
                <span className="font-mono font-bold text-foreground">{worker.bankAccount || "—"}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-border/40">
                <span className="text-muted-foreground">IFSC Code:</span>
                <span className="font-mono text-foreground">{worker.ifsc || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">UPI ID:</span>
                <span className="font-semibold text-[#1E3A8A]">{worker.upiId || "—"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Tracker */}
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="text-secondary" size={20} />
              Attendance Logging
            </CardTitle>
            
            {/* Month Selector */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleMonthChange("prev")}
                className="p-1.5 border border-border rounded-lg bg-card text-foreground hover:bg-muted cursor-pointer transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-bold text-foreground min-w-[120px] text-center">
                {new Date(year, month - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </span>
              <button 
                onClick={() => handleMonthChange("next")}
                className="p-1.5 border border-border rounded-lg bg-card text-foreground hover:bg-muted cursor-pointer transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            
            {isAttLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-secondary" size={32} />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Statistics panel */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 p-4 rounded-xl border border-border/50">
                  <div className="text-center border-r border-border/60 last:border-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Present</p>
                    <p className="text-xl font-extrabold text-emerald-600">
                      {attendance.filter(a => a.status === "PRESENT").length + attendance.filter(a => a.status === "HALF_DAY").length * 0.5}
                    </p>
                  </div>
                  <div className="text-center sm:border-r border-border/60 last:border-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Absent</p>
                    <p className="text-xl font-extrabold text-red-500">
                      {attendance.filter(a => a.status === "ABSENT").length + attendance.filter(a => a.status === "HALF_DAY").length * 0.5}
                    </p>
                  </div>
                  <div className="text-center border-r border-border/60 last:border-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Leaves / Holidays</p>
                    <p className="text-xl font-extrabold text-blue-500">
                      {attendance.filter(a => a.status === "LEAVE" || a.status === "HOLIDAY").length}
                    </p>
                  </div>
                  <div className="text-center last:border-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Overtime</p>
                    <p className="text-xl font-extrabold text-[#D4AF37]">
                      {attendance.reduce((sum, a) => sum + Number(a.overtimeHours), 0)} hrs
                    </p>
                  </div>
                </div>

                {/* Calendar grid view */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {days.map((day) => {
                    const record = getDayRecord(day);
                    const status = record?.status || "ABSENT";
                    const ot = record?.overtimeHours || 0;
                    const dateStr = day.toISOString();
                    const state = saveStatus[dateStr] || "idle";

                    return (
                      <div 
                        key={day.getDate()} 
                        className={`p-3 rounded-xl border transition-all ${
                          status === "PRESENT" 
                            ? "bg-emerald-50/10 border-emerald-500/20" 
                            : status === "HALF_DAY" 
                            ? "bg-amber-50/10 border-amber-500/20"
                            : status === "HOLIDAY"
                            ? "bg-blue-50/10 border-blue-500/20"
                            : "bg-card border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-foreground">
                            {day.toLocaleDateString("en-IN", { day: "2-digit", weekday: "short" })}
                          </span>
                          
                          {/* Sync states */}
                          {state === "saving" && <Loader2 className="animate-spin text-muted-foreground" size={14} />}
                          {state === "saved" && <CheckCircle2 className="text-emerald-500" size={14} />}
                          {state === "error" && <AlertCircle className="text-danger" size={14} />}
                        </div>

                        <div className="space-y-2">
                          {/* Status select */}
                          <div className="flex flex-col">
                            <select
                              value={status}
                              onChange={(e) => saveDayAttendance(day, e.target.value, ot)}
                              className="text-xs h-8 rounded-md border border-border bg-background px-2 focus:outline-none cursor-pointer"
                            >
                              <option value="PRESENT">PRESENT</option>
                              <option value="HALF_DAY">HALF DAY</option>
                              <option value="ABSENT">ABSENT</option>
                              <option value="LEAVE">LEAVE</option>
                              <option value="HOLIDAY">HOLIDAY</option>
                            </select>
                          </div>

                          {/* Overtime input */}
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground mr-auto">OT Hrs:</span>
                            <input
                              type="number"
                              min="0"
                              max="12"
                              step="0.5"
                              value={ot}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => saveDayAttendance(day, status, parseFloat(e.target.value) || 0)}
                              className="text-xs h-7 w-12 text-center rounded border border-border bg-background px-1 focus:outline-none font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Navigation>
  );
}
