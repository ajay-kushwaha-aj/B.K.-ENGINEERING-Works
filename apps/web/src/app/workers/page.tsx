"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WorkerSchema, WorkerType } from "shared";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Search, 
  Edit2, 
  Phone, 
  Mail, 
  MapPin, 
  User as UserIcon,
  X,
  Loader2,
  HardHat,
  Eye,
  CreditCard,
  FileCheck2,
  Image as ImageIcon
} from "lucide-react";

export default function WorkersPage() {
  const [workers, setWorkers] = React.useState<WorkerType[]>([]);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [deptFilter, setDeptFilter] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingWorker, setEditingWorker] = React.useState<WorkerType | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // base64 states
  const [photoBase64, setPhotoBase64] = React.useState<string | null>(null);
  const [idProofBase64, setIdProofBase64] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkerType>({
    resolver: zodResolver(WorkerSchema),
  });

  const fetchWorkers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set("search", search);
      if (statusFilter) queryParams.set("status", statusFilter);
      if (deptFilter) queryParams.set("department", deptFilter);

      const res = await fetch(`/api/workers?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setWorkers(data);
      } else {
        throw new Error(data.error || "Failed to fetch workers");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, deptFilter]);

  React.useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: "photoUrl" | "idProofUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setValue(fieldName, base64String);
      if (fieldName === "photoUrl") setPhotoBase64(base64String);
      if (fieldName === "idProofUrl") setIdProofBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const openAddModal = () => {
    setEditingWorker(null);
    setPhotoBase64(null);
    setIdProofBase64(null);
    reset({
      name: "",
      fatherName: "",
      designation: "",
      department: "",
      phone: "",
      email: "",
      address: "",
      aadharNumber: "",
      panNumber: "",
      photoUrl: "",
      idProofUrl: "",
      joiningDate: new Date().toISOString().split("T")[0],
      status: "ACTIVE",
      salaryType: "MONTHLY",
      basicSalary: 0,
      bankName: "",
      bankAccount: "",
      ifsc: "",
      upiId: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (worker: WorkerType) => {
    setEditingWorker(worker);
    setPhotoBase64(worker.photoUrl || null);
    setIdProofBase64(worker.idProofUrl || null);
    
    // Format date for input
    const formatted = {
      ...worker,
      joiningDate: worker.joiningDate ? new Date(worker.joiningDate).toISOString().split("T")[0] : "",
    };
    reset(formatted);
    setIsModalOpen(true);
  };

  const onSubmit = async (data: WorkerType) => {
    setErrorMsg(null);
    try {
      const url = editingWorker ? `/api/workers/${editingWorker.id}` : "/api/workers";
      const method = editingWorker ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to save worker profile");
      }

      setIsModalOpen(false);
      fetchWorkers();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    }
  };

  // Unique departments for filter dropdown
  const departments = ["Fabrication", "Erection", "Maintenance", "Quality Assurance", "Design", "Logistics", "Office"];

  return (
    <Navigation>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <HardHat className="text-royal-blue text-[#1E3A8A]" size={28} />
              Workers
              <span className="text-xs bg-[#1E3A8A]/10 text-[#1E3A8A] border border-[#1E3A8A]/20 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded-full font-mono font-medium">
                {workers.length} total
              </span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage contractor profiles, designations, salary parameters, and banking information.
            </p>
          </div>
          <Button onClick={openAddModal} className="flex items-center gap-2 self-start sm:self-auto">
            <Plus size={18} />
            Add Worker
          </Button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search by name, designation, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full pl-10 pr-4 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 rounded-xl border border-border bg-card text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 cursor-pointer text-sm"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="ON_LEAVE">ON LEAVE</option>
              <option value="TERMINATED">TERMINATED</option>
            </select>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-11 rounded-xl border border-border bg-card text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 cursor-pointer text-sm"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-secondary" size={36} />
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/50">
            <UserIcon className="mx-auto text-muted-foreground/50 mb-3" size={48} />
            <h3 className="text-lg font-bold text-foreground">No workers found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search || statusFilter || deptFilter 
                ? "Try refining your search filters." 
                : "Get started by adding your first worker profile."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto border border-border rounded-2xl bg-card shadow-sm">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Worker</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Designation</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Department</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Salary Rate</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {workers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {worker.photoUrl ? (
                            <img 
                              src={worker.photoUrl} 
                              alt={worker.name} 
                              className="w-10 h-10 rounded-full object-cover border border-border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                              <UserIcon size={18} />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-foreground">{worker.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{worker.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {worker.designation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {worker.department || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        ₹{Number(worker.basicSalary).toLocaleString("en-IN")} ({worker.salaryType})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                          worker.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : worker.status === "ON_LEAVE"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}>
                          {worker.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/workers/${worker.id}`}
                            className="p-2 text-slate-500 hover:text-secondary rounded-lg hover:bg-muted transition-colors cursor-pointer"
                            title="View Profile & Attendance"
                          >
                            <Eye size={16} />
                          </Link>
                          <button
                            onClick={() => openEditModal(worker)}
                            className="p-2 text-slate-500 hover:text-secondary rounded-lg hover:bg-muted transition-colors cursor-pointer"
                            title="Edit Profile"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {workers.map((worker) => (
                <Card key={worker.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0">
                    <div className="flex items-center gap-3">
                      {worker.photoUrl ? (
                        <img 
                          src={worker.photoUrl} 
                          alt={worker.name} 
                          className="w-12 h-12 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                          <UserIcon size={20} />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-foreground text-lg leading-snug">{worker.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{worker.designation} • {worker.department || "General"}</p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-2xs font-extrabold ${
                      worker.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                        : worker.status === "ON_LEAVE"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {worker.status}
                    </span>
                  </CardHeader>
                  <CardContent className="pt-2 pb-4 text-sm space-y-2">
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Phone size={14} /> Contact</span>
                      <span className="font-medium text-foreground">{worker.phone}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground flex items-center gap-1.5"><CreditCard size={14} /> Basic Pay</span>
                      <span className="font-bold text-foreground">₹{Number(worker.basicSalary).toLocaleString("en-IN")} ({worker.salaryType})</span>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Link href={`/workers/${worker.id}`}>
                        <Button size="sm" variant="outline" className="flex items-center gap-1.5">
                          <Eye size={14} /> View
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline" onClick={() => openEditModal(worker)} className="flex items-center gap-1.5">
                        <Edit2 size={14} /> Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative bg-card w-full max-w-3xl rounded-2xl shadow-xl border border-border my-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="p-6 md:p-8 max-h-[85vh] overflow-y-auto">
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                  {editingWorker ? "Edit Worker Profile" : "Register New Worker"}
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Fill in all fields for KYC, bank details, and wage assignments.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Photo Upload row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="flex flex-col items-center justify-center">
                      {photoBase64 ? (
                        <img 
                          src={photoBase64} 
                          alt="Profile Preview" 
                          className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-400">
                          <ImageIcon size={32} />
                        </div>
                      )}
                      <span className="text-[10px] text-muted-foreground mt-2">Worker Photo</span>
                    </div>
                    
                    <div className="md:col-span-2 space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Upload Profile Image</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, "photoUrl")}
                          className="text-xs block w-full text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Upload ID Proof (Aadhar/PAN)</label>
                        <input 
                          type="file" 
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFileChange(e, "idProofUrl")}
                          className="text-xs block w-full text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                        />
                        {idProofBase64 && (
                          <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                            <FileCheck2 size={12} /> ID Proof uploaded
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Personal Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">1. Personal & Contact Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Full Name *"
                        placeholder="e.g. Ramesh Kumar"
                        error={errors.name?.message}
                        {...register("name")}
                      />
                      <Input
                        label="Father's Name"
                        placeholder="e.g. Sohan Lal"
                        error={errors.fatherName?.message}
                        {...register("fatherName")}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="Phone Number *"
                        placeholder="+91 9876543210"
                        error={errors.phone?.message}
                        {...register("phone")}
                      />
                      <Input
                        label="Email Address"
                        placeholder="e.g. ramesh@gmail.com"
                        error={errors.email?.message}
                        {...register("email")}
                      />
                      <Input
                        label="Joining Date *"
                        type="date"
                        error={errors.joiningDate?.message}
                        {...register("joiningDate")}
                      />
                    </div>

                    <Textarea
                      label="Residential Address"
                      placeholder="Enter complete residential address..."
                      error={errors.address?.message}
                      {...register("address")}
                    />
                  </div>

                  {/* Section 2: Designation & Salary */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">2. Role & Payroll Specifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Designation (Role) *"
                        placeholder="e.g. Welder, Fitter, Helper, Supervisor"
                        error={errors.designation?.message}
                        {...register("designation")}
                      />
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-foreground">Department</label>
                        <select
                          {...register("department")}
                          className="h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary cursor-pointer"
                        >
                          <option value="">Select Department</option>
                          {departments.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-foreground">Salary Term *</label>
                        <select
                          {...register("salaryType")}
                          className="h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary cursor-pointer"
                        >
                          <option value="MONTHLY">MONTHLY (Fixed)</option>
                          <option value="DAILY">DAILY (Pro-rated)</option>
                          <option value="CONTRACT">CONTRACT (Lump-sum)</option>
                        </select>
                      </div>
                      <Input
                        label="Basic Wage / Rate (₹) *"
                        type="number"
                        placeholder="800"
                        error={errors.basicSalary?.message}
                        {...register("basicSalary", { valueAsNumber: true })}
                      />
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-foreground">Status *</label>
                        <select
                          {...register("status")}
                          className="h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary cursor-pointer"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                          <option value="ON_LEAVE">ON LEAVE</option>
                          <option value="TERMINATED">TERMINATED</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Identity & Bank */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">3. KYC & Banking Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Aadhar Number"
                        placeholder="12-digit Aadhar"
                        error={errors.aadharNumber?.message}
                        {...register("aadharNumber")}
                      />
                      <Input
                        label="PAN Card Number"
                        placeholder="10-digit PAN"
                        error={errors.panNumber?.message}
                        {...register("panNumber")}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Bank Name"
                        placeholder="e.g. State Bank of India"
                        error={errors.bankName?.message}
                        {...register("bankName")}
                      />
                      <Input
                        label="Account Number"
                        placeholder="Bank Account Number"
                        error={errors.bankAccount?.message}
                        {...register("bankAccount")}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="IFSC Code"
                        placeholder="e.g. SBIN0000213"
                        error={errors.ifsc?.message}
                        {...register("ifsc")}
                      />
                      <Input
                        label="UPI ID"
                        placeholder="e.g. worker@upi"
                        error={errors.upiId?.message}
                        {...register("upiId")}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                      Save Worker
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Navigation>
  );
}
