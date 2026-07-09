"use client";

import * as React from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  CalendarDays, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  User,
  HardHat,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface AttendanceRecord {
  workerId: string;
  status: "PRESENT" | "HALF_DAY" | "ABSENT" | "LEAVE" | "HOLIDAY";
  overtimeHours: number;
  notes: string;
}

export default function DailyAttendancePage() {
  const [date, setDate] = React.useState<string>(new Date().toISOString().split("T")[0]);
  const [sheet, setSheet] = React.useState<Record<string, AttendanceRecord>>({});
  const [workers, setWorkers] = React.useState<any[]>([]);
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Fetch attendance sheet for the selected date
  const fetchAttendanceSheet = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/attendance?date=${date}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load attendance");

      // Set workers list
      setWorkers(data.map((item: any) => item.worker));

      // Build sheet state map
      const stateMap: Record<string, AttendanceRecord> = {};
      data.forEach((item: any) => {
        stateMap[item.worker.id] = {
          workerId: item.worker.id,
          status: item.attendance?.status || "ABSENT",
          overtimeHours: item.attendance?.overtimeHours || 0,
          notes: item.attendance?.notes || "",
        };
      });
      setSheet(stateMap);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  React.useEffect(() => {
    fetchAttendanceSheet();
  }, [fetchAttendanceSheet]);

  const handleStatusChange = (workerId: string, status: AttendanceRecord["status"]) => {
    setSheet(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        status,
      }
    }));
  };

  const handleOvertimeChange = (workerId: string, overtimeHours: number) => {
    setSheet(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        overtimeHours: Math.max(0, overtimeHours),
      }
    }));
  };

  const handleNotesChange = (workerId: string, notes: string) => {
    setSheet(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        notes,
      }
    }));
  };

  // Mark all active workers present on local screen state
  const handleMarkAllPresent = () => {
    setSheet(prev => {
      const updated = { ...prev };
      workers.forEach(w => {
        updated[w.id] = {
          ...updated[w.id],
          status: "PRESENT",
        };
      });
      return updated;
    });
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    setErrorMsg(null);
    try {
      const logs = Object.values(sheet);
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          logs,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save attendance");
      }

      setSaveMessage("Attendance saved successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const adjustDate = (days: number) => {
    const current = new Date(date);
    current.setDate(current.getDate() + days);
    setDate(current.toISOString().split("T")[0]);
  };

  return (
    <Navigation>
      <div className="space-y-6">
        
        {/* Title and date navigations */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <CalendarDays className="text-secondary" size={28} />
              Daily Attendance Sheet
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Select date to mark status, record overtime (OT), and log site notes for active workers.
            </p>
          </div>

          {/* Date Selector Wrapper */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-card border border-border p-1.5 rounded-xl shadow-sm">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => adjustDate(-1)}
              className="p-2 cursor-pointer h-9 w-9"
            >
              <ChevronLeft size={16} />
            </Button>
            
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-0 text-sm font-bold text-foreground focus:outline-none focus:ring-0 cursor-pointer text-center w-[120px]"
            />
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => adjustDate(1)}
              className="p-2 cursor-pointer h-9 w-9"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/20 border border-border/60 p-4 rounded-xl">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleMarkAllPresent}
              disabled={isLoading || workers.length === 0}
              className="text-xs h-9 font-semibold"
            >
              Mark All Present Today
            </Button>
          </div>

          <Button
            onClick={handleSaveAttendance}
            disabled={isLoading || isSaving || workers.length === 0}
            className="flex items-center gap-1.5 h-9"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            Save Attendance
          </Button>
        </div>

        {/* Action Feedbacks */}
        {saveMessage && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 size={18} />
            {saveMessage}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm font-semibold flex items-center gap-2">
            <AlertCircle size={18} />
            {errorMsg}
          </div>
        )}

        {/* Attendance Main Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-secondary" size={40} />
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card">
            <HardHat className="mx-auto text-muted-foreground/40 mb-3" size={48} />
            <h3 className="text-lg font-bold text-foreground">No active workers found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add active workers in the Worker Directory first.
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
            
            {/* Desktop Table Layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Worker details</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Status Marking</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground w-32">Overtime (OT)</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Location / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {workers.map((worker) => {
                    const record = sheet[worker.id] || { status: "ABSENT", overtimeHours: 0, notes: "" };
                    return (
                      <tr key={worker.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {worker.photoUrl ? (
                              <img src={worker.photoUrl} alt={worker.name} className="w-9 h-9 rounded-full object-cover border border-border" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-border text-slate-400">
                                <User size={16} />
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-foreground text-sm">{worker.name}</div>
                              <div className="text-xs text-muted-foreground">{worker.designation} • {worker.salaryType}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="inline-flex rounded-lg border border-border p-1 bg-muted/30">
                            {[
                              { code: "PRESENT", label: "Present", color: "bg-emerald-500 text-white" },
                              { code: "HALF_DAY", label: "Half Day", color: "bg-amber-500 text-white" },
                              { code: "ABSENT", label: "Absent", color: "bg-red-500 text-white" },
                              { code: "LEAVE", label: "Leave", color: "bg-blue-500 text-white" },
                              { code: "HOLIDAY", label: "Holiday", color: "bg-indigo-500 text-white" }
                            ].map((btn) => {
                              const isSel = record.status === btn.code;
                              return (
                                <button
                                  key={btn.code}
                                  type="button"
                                  onClick={() => handleStatusChange(worker.id, btn.code as any)}
                                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                    isSel ? btn.color : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                  }`}
                                >
                                  {btn.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Clock size={14} className="text-muted-foreground" />
                            <input
                              type="number"
                              min="0"
                              max="12"
                              step="0.5"
                              value={record.overtimeHours}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleOvertimeChange(worker.id, parseFloat(e.target.value) || 0)}
                              className="w-16 h-8 text-center text-xs border border-border rounded bg-background focus:outline-none font-bold"
                            />
                            <span className="text-2xs text-muted-foreground">hrs</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            placeholder="e.g. Site A fabrication, site advance"
                            value={record.notes}
                            onChange={(e) => handleNotesChange(worker.id, e.target.value)}
                            className="w-full max-w-xs h-8 text-xs border border-border rounded bg-background px-2.5 focus:outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Layout */}
            <div className="md:hidden divide-y divide-border">
              {workers.map((worker) => {
                const record = sheet[worker.id] || { status: "ABSENT", overtimeHours: 0, notes: "" };
                return (
                  <div key={worker.id} className="p-4 space-y-3 bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {worker.photoUrl ? (
                          <img src={worker.photoUrl} alt={worker.name} className="w-8 h-8 rounded-full object-cover border border-border" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-border text-slate-400">
                            <User size={14} />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-foreground text-xs">{worker.name}</div>
                          <div className="text-[10px] text-muted-foreground leading-tight">{worker.designation} • {worker.salaryType}</div>
                        </div>
                      </div>
                      
                      {/* Mobile OT input */}
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground mr-1">OT:</span>
                        <input
                          type="number"
                          min="0"
                          max="12"
                          step="0.5"
                          value={record.overtimeHours}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleOvertimeChange(worker.id, parseFloat(e.target.value) || 0)}
                          className="w-12 h-7 text-center text-xs border border-border rounded bg-background focus:outline-none font-bold"
                        />
                      </div>
                    </div>

                    {/* Status Button Selection */}
                    <div className="grid grid-cols-5 gap-1 p-1 bg-muted/20 border border-border rounded-lg text-center">
                      {[
                        { code: "PRESENT", label: "Pres", color: "bg-emerald-500 text-white" },
                        { code: "HALF_DAY", label: "Half", color: "bg-amber-500 text-white" },
                        { code: "ABSENT", label: "Abs", color: "bg-red-500 text-white" },
                        { code: "LEAVE", label: "Leave", color: "bg-blue-500 text-white" },
                        { code: "HOLIDAY", label: "Hol", color: "bg-indigo-500 text-white" }
                      ].map((btn) => {
                        const isSel = record.status === btn.code;
                        return (
                          <button
                            key={btn.code}
                            type="button"
                            onClick={() => handleStatusChange(worker.id, btn.code as any)}
                            className={`py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                              isSel ? btn.color : "text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {btn.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Notes input */}
                    <input
                      type="text"
                      placeholder="Daily notes (optional)"
                      value={record.notes}
                      onChange={(e) => handleNotesChange(worker.id, e.target.value)}
                      className="w-full h-8 text-xs border border-border rounded bg-background px-2.5 focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>
            
          </div>
        )}

      </div>
    </Navigation>
  );
}
