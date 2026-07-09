"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CompanySchema, CompanyType, INDIAN_STATES } from "shared";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { 
  Upload, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Users, 
  Plus, 
  ShieldAlert, 
  ShieldCheck, 
  Settings, 
  HardHat, 
  Lock, 
  Unlock, 
  Loader2 
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<"profile" | "users">("profile");
  const [isLoading, setIsLoading] = React.useState(false);
  const [statusMsg, setStatusMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Local state for image previews
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = React.useState<string | null>(null);
  const [sealPreview, setSealPreview] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CompanyType>({
    resolver: zodResolver(CompanySchema),
    defaultValues: {
      name: "",
      gstin: "",
      pan: "",
      address: "",
      email: "",
      phone: "",
      website: "",
      bankName: "",
      bankAccount: "",
      ifsc: "",
      upiId: "",
      invoicePrefix: "BK",
      state: "Karnataka",
      termsDefault: "",
      logoUrl: "",
      signatureUrl: "",
      sealUrl: "",
    },
  });

  // Load settings on mount
  React.useEffect(() => {
    const loadCompanySettings = async () => {
      setIsLoading(true);
      try {
        // Real Supabase load
        const { data, error } = await supabase
          .from("Company")
          .select("*")
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 is code for no rows returned, which is fine on first load
          throw error;
        }

        if (data) {
          reset(data);
          setLogoPreview(data.logoUrl || null);
          setSignaturePreview(data.signatureUrl || null);
          setSealPreview(data.sealUrl || null);
        }
      } catch (err: any) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanySettings();
  }, [reset]);

  // Handle local file uploads (converts to base64 for local persistence in sandbox)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: "logoUrl" | "signatureUrl" | "sealUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setValue(fieldName, base64String);
      
      if (fieldName === "logoUrl") setLogoPreview(base64String);
      if (fieldName === "signatureUrl") setSignaturePreview(base64String);
      if (fieldName === "sealUrl") setSealPreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: CompanyType) => {
    setIsLoading(true);
    setStatusMsg(null);

    try {
      // Upsert company details into database
      const companyPayload = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      let dbError;
      if (data.id) {
        const { error } = await supabase
          .from("Company")
          .update(companyPayload)
          .eq("id", data.id);
        dbError = error;
      } else {
        const { error } = await supabase
          .from("Company")
          .insert([{ ...companyPayload, id: `comp_${Date.now()}` }]);
        dbError = error;
      }

      if (dbError) throw dbError;

      setStatusMsg({ type: "success", text: "Company settings saved successfully!" });
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: "error", text: err.message || "Failed to save settings. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Navigation>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Settings & Controls
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure company profile parameters or manage system access and permissions.
          </p>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-border gap-6 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`pb-2 text-sm font-bold border-b-2 cursor-pointer transition-all uppercase tracking-wider ${
              activeTab === "profile" 
                ? "border-primary text-foreground font-black" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Company Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`pb-2 text-sm font-bold border-b-2 cursor-pointer transition-all uppercase tracking-wider ${
              activeTab === "users" 
                ? "border-primary text-foreground font-black" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            User Access Management
          </button>
        </div>

        {/* TAB 1: COMPANY PROFILE */}
        {activeTab === "profile" && (
          <form onSubmit={handleSubmit(onSubmit)}>
            {statusMsg && (
              <div
                className={`p-4 rounded-xl flex items-start gap-3 border mb-6 ${
                  statusMsg.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400"
                    : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400"
                }`}
              >
                <AlertCircle className="mt-0.5 shrink-0" size={18} />
                <p className="text-xs font-semibold">{statusMsg.text}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Form Fields */}
              <div className="lg:col-span-2 space-y-8">
                {/* Basic Details */}
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Company Profile</CardTitle>
                    <CardDescription className="text-xs">
                      Official registration details used on tax invoices and work orders.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Company Legal Name</label>
                        <Input required placeholder="B.K. Engineering Works" {...register("name")} className="text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">GSTIN (Tax ID)</label>
                        <Input placeholder="29XXXXX0000X0Z0" {...register("gstin")} className="text-xs font-mono uppercase" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">PAN Number</label>
                        <Input placeholder="ABCDE1234F" {...register("pan")} className="text-xs font-mono uppercase" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Invoice ID Prefix</label>
                        <Input placeholder="BK" {...register("invoicePrefix")} className="text-xs font-mono uppercase" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Registered Address</label>
                      <Textarea required placeholder="Shop No. 5, Industrial Area, Bangalore" {...register("address")} className="text-xs min-h-[60px]" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">State</label>
                        <select
                          {...register("state")}
                          className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Email Contact</label>
                        <Input placeholder="contact@bkengineering.com" {...register("email")} className="text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Phone Number</label>
                        <Input placeholder="+91 9876543210" {...register("phone")} className="text-xs" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Banking & Terms */}
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Banking & Legal Defaults</CardTitle>
                    <CardDescription className="text-xs">
                      Default bank accounts added to invoice footers and legal disclaimer clauses.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Beneficiary Bank Name</label>
                        <Input placeholder="State Bank of India" {...register("bankName")} className="text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Bank Account Number</label>
                        <Input placeholder="300012345678" {...register("bankAccount")} className="text-xs font-mono" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Bank IFSC Code</label>
                        <Input placeholder="SBIN0000123" {...register("ifsc")} className="text-xs font-mono uppercase" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">UPI QR ID (optional)</label>
                        <Input placeholder="bkengineering@sbi" {...register("upiId")} className="text-xs font-mono" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Invoice Disclaimer / T&C Clauses</label>
                      <Textarea placeholder="1. Interest @18% will be charged if payment is not received within 15 days..." {...register("termsDefault")} className="text-xs min-h-[80px]" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Assets & Backups */}
              <div className="space-y-8">
                {/* Branding Assets */}
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Branding Signatures</CardTitle>
                    <CardDescription className="text-xs">
                      Official graphic assets rendered in PDF tax slips.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Logo Upload */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-foreground">Company Logo</span>
                      <div className="border-2 border-dashed border-border/80 rounded-xl p-4 relative group flex flex-col items-center justify-center min-h-[120px] hover:border-secondary transition-all">
                        {logoPreview ? (
                          <div className="text-center">
                            <img src={logoPreview} alt="Logo" className="max-h-16 object-contain mx-auto mb-2" />
                            <button
                              type="button"
                              onClick={() => { setLogoPreview(null); setValue("logoUrl", ""); }}
                              className="text-[10px] font-bold text-red-500 hover:text-red-700 cursor-pointer"
                            >
                              Remove Logo
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center cursor-pointer">
                            <Upload className="text-muted-foreground group-hover:text-secondary transition-colors mb-2" size={24} />
                            <span className="text-xs text-muted-foreground">Click to upload Logo</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, "logoUrl")}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Signature Upload */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-foreground">Authorized Signature</span>
                      <div className="border-2 border-dashed border-border/80 rounded-xl p-4 relative group flex flex-col items-center justify-center min-h-[120px] hover:border-secondary transition-all">
                        {signaturePreview ? (
                          <div className="text-center">
                            <img src={signaturePreview} alt="Signature" className="max-h-12 object-contain mx-auto mb-2" />
                            <button
                              type="button"
                              onClick={() => { setSignaturePreview(null); setValue("signatureUrl", ""); }}
                              className="text-[10px] font-bold text-red-500 hover:text-red-700 cursor-pointer"
                            >
                              Remove Signature
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center cursor-pointer">
                            <Upload className="text-muted-foreground group-hover:text-secondary transition-colors mb-2" size={24} />
                            <span className="text-xs text-muted-foreground">Click to upload Signature</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, "signatureUrl")}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Seal Upload */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-foreground">Official Seal</span>
                      <div className="border-2 border-dashed border-border/80 rounded-xl p-4 relative group flex flex-col items-center justify-center min-h-[120px] hover:border-secondary transition-all">
                        {sealPreview ? (
                          <div className="text-center">
                            <img src={sealPreview} alt="Seal" className="max-h-16 object-contain mx-auto mb-2" />
                            <button
                              type="button"
                              onClick={() => { setSealPreview(null); setValue("sealUrl", ""); }}
                              className="text-[10px] font-bold text-red-500 hover:text-red-700 cursor-pointer"
                            >
                              Remove Seal
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center cursor-pointer">
                            <Upload className="text-muted-foreground group-hover:text-secondary transition-colors mb-2" size={24} />
                            <span className="text-xs text-muted-foreground">Click to upload Seal</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, "sealUrl")}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Database Backup & Restore Card */}
                <Card className="border-border/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold">Database Backup & Restore</CardTitle>
                    <CardDescription className="text-xs">
                      Export full ERP database records or restore them from a JSON backup.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-center gap-1.5 cursor-pointer text-xs"
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/backup");
                          const data = await res.json();
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `bk_erp_backup_${new Date().toISOString().split("T")[0]}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch (err) {
                          alert("Backup failed");
                        }
                      }}
                    >
                      Export JSON Backup
                    </Button>
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-center gap-1.5 cursor-pointer text-xs text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        Import JSON Restore
                      </Button>
                      <input
                        type="file"
                        accept=".json"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!confirm("WARNING: Importing a backup will overwrite the current database! Proceed?")) return;
                          const reader = new FileReader();
                          reader.onload = async () => {
                            try {
                              const parsed = JSON.parse(reader.result as string);
                              const res = await fetch("/api/backup", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(parsed),
                              });
                              if (res.ok) {
                                alert("Restore completed successfully! Reloading page...");
                                window.location.reload();
                              } else {
                                alert("Failed to restore backup");
                              }
                            } catch (err) {
                              alert("Invalid backup file format");
                            }
                          };
                          reader.readAsText(file);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons Panel */}
                <div className="flex flex-col gap-3">
                  <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                    Save Settings
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={async () => {
                      if (confirm("Are you sure you want to revert changes?")) {
                        setIsLoading(true);
                        try {
                          const { data } = await supabase
                            .from("Company")
                            .select("*")
                            .limit(1)
                            .single();
                          if (data) {
                            reset(data);
                            setLogoPreview(data.logoUrl || null);
                            setSignaturePreview(data.signatureUrl || null);
                            setSealPreview(data.sealUrl || null);
                          } else {
                            reset({});
                            setLogoPreview(null);
                            setSignaturePreview(null);
                            setSealPreview(null);
                          }
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsLoading(false);
                        }
                      }
                    }}
                  >
                    Reset Form
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: USER & ACCESS MANAGEMENT */}
        {activeTab === "users" && <UserAccessManager />}
      </div>
    </Navigation>
  );
}

/* ==========================================
   USER & ACCESS MANAGEMENT SUB-COMPONENT
   ========================================== */
function UserAccessManager() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [contracts, setContracts] = React.useState<any[]>([]);
  const [sites, setSites] = React.useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [statusMsg, setStatusMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Invite user state
  const [newUser, setNewUser] = React.useState({
    email: "",
    name: "",
    phone: "",
    role: "SITE_MANAGER"
  });

  // Access assignment state
  const [newAccess, setNewAccess] = React.useState({
    contractId: "",
    siteId: "", // empty means All Sites
    permissions: {
      attendance: true,
      measurement: true,
      materialRequest: true,
      viewProgress: true
    }
  });

  const sessionStr = typeof window !== "undefined" ? localStorage.getItem("bk_session") : null;
  const token = sessionStr ? JSON.parse(sessionStr).token : "";

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      // 1. Fetch Users
      const usersRes = await fetch("/api/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (usersRes.ok) setUsers(await usersRes.json());

      // 2. Fetch Contracts
      const conRes = await fetch("/api/contracts", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (conRes.ok) {
        const conData = await conRes.json();
        setContracts(conData);
        if (conData.length > 0) {
          setNewAccess(p => ({ ...p, contractId: conData[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
      setStatusMsg({ type: "error", text: "Failed to load management database" });
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Load sites when contract changes
  React.useEffect(() => {
    if (!newAccess.contractId) return;
    const fetchSites = async () => {
      try {
        const res = await fetch(`/api/sites?contractId=${newAccess.contractId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) setSites(await res.json());
      } catch (e) {
        console.error(e);
      }
    };
    fetchSites();
  }, [newAccess.contractId, token]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: "success", text: `Successfully invited user ${newUser.email}!` });
        setNewUser({ email: "", name: "", phone: "", role: "SITE_MANAGER" });
        loadData();
      } else {
        throw new Error(data.error || "Failed to create user");
      }
    } catch (e: any) {
      setStatusMsg({ type: "error", text: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to toggle status");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${selectedUserId}/access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          contractId: newAccess.contractId,
          siteId: newAccess.siteId || null,
          permissions: newAccess.permissions
        })
      });
      if (res.ok) {
        setNewAccess(p => ({
          ...p,
          siteId: "",
          permissions: { attendance: true, measurement: true, materialRequest: true, viewProgress: true }
        }));
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to assign access");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeAccess = async (accessId: string) => {
    if (!selectedUserId) return;
    if (!confirm("Are you sure you want to revoke this site access?")) return;
    try {
      const res = await fetch(`/api/users/${selectedUserId}/access?accessId=${accessId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to revoke access");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activeUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      {statusMsg && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border ${
            statusMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400"
              : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400"
          }`}
        >
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <p className="text-xs font-semibold">{statusMsg.text}</p>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 size={32} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Creator Card */}
          <div className="space-y-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users size={18} /> Invite Site Manager
                </CardTitle>
                <CardDescription className="text-xs">
                  Creates user profile and sends Supabase magic login links.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleCreateUser}>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Full Name</label>
                    <Input
                      required
                      placeholder="Ajay Kushwaha"
                      value={newUser.name}
                      onChange={(e) => setNewUser(p => ({ ...p, name: e.target.value }))}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Email Address</label>
                    <Input
                      required
                      type="email"
                      placeholder="manager.ajay@bk.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser(p => ({ ...p, email: e.target.value }))}
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Phone Number</label>
                    <Input
                      placeholder="+91 9988776655"
                      value={newUser.phone}
                      onChange={(e) => setNewUser(p => ({ ...p, phone: e.target.value }))}
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">System Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser(p => ({ ...p, role: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground font-semibold"
                    >
                      <option value="SITE_MANAGER">Site Manager (Restricted)</option>
                      <option value="ADMIN">Owner Admin (Full Control)</option>
                    </select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full text-xs font-bold gap-1.5 cursor-pointer" disabled={isSaving}>
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Create Profile & Invite
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* User List Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Active Staff Directory</CardTitle>
                <CardDescription className="text-xs">
                  Directory of system admins and managers. Manage their site access privileges under specific contracts.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border">
                {users.map(userItem => {
                  const isUserActive = userItem.status === "ACTIVE";
                  return (
                    <div
                      key={userItem.id}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                        selectedUserId === userItem.id ? "bg-slate-50 dark:bg-slate-900/50 font-bold" : "hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-foreground">{userItem.name}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                            userItem.role === "ADMIN" 
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-400" 
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400"
                          }`}>
                            {userItem.role}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                            isUserActive 
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400" 
                              : "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400"
                          }`}>
                            {userItem.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-[250px]">{userItem.email}</p>
                        {userItem.phone && <p className="text-[10px] text-muted-foreground font-mono">{userItem.phone}</p>}
                      </div>

                      <div className="flex items-center gap-2">
                        {userItem.role !== "ADMIN" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs font-semibold cursor-pointer gap-1.5"
                            onClick={() => setSelectedUserId(selectedUserId === userItem.id ? "" : userItem.id)}
                          >
                            <Settings size={12} />
                            Site Permissions ({userItem.siteAccess?.length || 0})
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={isUserActive ? "danger" : "outline"}
                          className="text-xs font-semibold cursor-pointer gap-1.5"
                          onClick={() => handleToggleStatus(userItem.id, userItem.status)}
                        >
                          {isUserActive ? <Lock size={12} /> : <Unlock size={12} />}
                          {isUserActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Selected User Perm Controls */}
            {selectedUserId && activeUser && (
              <Card className="border-border border-2 shadow-md">
                <CardHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="text-emerald-600" size={18} /> Configure Site Access: {activeUser.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Assign site manager to a specific contract/site, and toggle active permissions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Access Grant Form */}
                  <form onSubmit={handleGrantAccess} className="space-y-4 bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-xl border border-border">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">Assign New Access Path</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Select Contract</label>
                        <select
                          required
                          value={newAccess.contractId}
                          onChange={(e) => setNewAccess(p => ({ ...p, contractId: e.target.value }))}
                          className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground font-semibold"
                        >
                          {contracts.map(c => (
                            <option key={c.id} value={c.id}>{c.contractNumber} - {c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Select Site Location</label>
                        <select
                          value={newAccess.siteId}
                          onChange={(e) => setNewAccess(p => ({ ...p, siteId: e.target.value }))}
                          className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground font-semibold"
                        >
                          <option value="">-- All Sites --</option>
                          {sites.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.location || "No Loc"})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Permissions list checkboxes */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Explicit Privileges</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.keys(newAccess.permissions).map((permKey) => {
                          const val = (newAccess.permissions as any)[permKey];
                          return (
                            <label key={permKey} className="flex items-center gap-2 bg-background p-2 border border-border rounded-lg cursor-pointer">
                              <input
                                type="checkbox"
                                checked={val}
                                onChange={(e) => setNewAccess(p => ({
                                  ...p,
                                  permissions: { ...p.permissions, [permKey]: e.target.checked }
                                }))}
                                className="w-3.5 h-3.5"
                              />
                              <span className="text-[10px] font-bold uppercase text-foreground">{permKey.replace(/([A-Z])/g, " $1")}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <Button type="submit" className="w-full text-xs font-bold gap-1 cursor-pointer" disabled={isSaving}>
                      <Plus size={14} /> Assign Permissions
                    </Button>
                  </form>

                  {/* Active list */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">Currently Assigned Access Locations</p>
                    {activeUser.siteAccess && activeUser.siteAccess.length > 0 ? (
                      <div className="space-y-2">
                        {activeUser.siteAccess.map((accessItem: any) => {
                          const perms = accessItem.permissions || {};
                          return (
                            <div key={accessItem.id} className="p-4 bg-background rounded-xl border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                              <div className="space-y-1">
                                <p className="font-bold text-foreground">
                                  {accessItem.contract?.name || `Contract ID: ${accessItem.contractId}`}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  Site: <span className="font-semibold">{accessItem.site?.name || "ALL SITES UNDER CONTRACT"}</span>
                                </p>
                                <div className="flex gap-1.5 flex-wrap pt-1">
                                  {Object.entries(perms).map(([k, v]) => v ? (
                                    <span key={k} className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase px-1.5 py-0.5 rounded">
                                      {k}
                                    </span>
                                  ) : null)}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="danger"
                                className="text-xs gap-1 cursor-pointer"
                                onClick={() => handleRevokeAccess(accessItem.id)}
                              >
                                <Trash2 size={12} /> Revoke
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic py-2">No site privileges granted to this manager yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
