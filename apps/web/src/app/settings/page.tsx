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
  Loader2,
  Building,
  FileText,
  CreditCard,
  Hash,
  MapPin,
  Mail,
  Phone,
  Landmark,
  Wallet,
  Code,
  QrCode,
  Scale,
  X
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<"profile" | "users">("profile");
  const [isLoading, setIsLoading] = React.useState(false);
  const [statusMsg, setStatusMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Edit permission controls
  const [isEditable, setIsEditable] = React.useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = React.useState(false);
  const [verifyPassword, setVerifyPassword] = React.useState("");
  const [verifyError, setVerifyError] = React.useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = React.useState(false);
  const [currentUserEmail, setCurrentUserEmail] = React.useState("");

  // Local state for image previews
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = React.useState<string | null>(null);
  const [sealPreview, setSealPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    const sessionStr = localStorage.getItem("bk_session");
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session?.user?.email) {
          setCurrentUserEmail(session.user.email);
        }
      } catch (e) {
        console.error("Failed to load user email:", e);
      }
    }
  }, []);

  const handleVerifyAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    setVerifyLoading(true);

    try {
      if (!currentUserEmail) {
        throw new Error("No active admin session found. Please log in again.");
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: currentUserEmail,
        password: verifyPassword,
      });

      if (error) {
        throw error;
      }

      setIsEditable(true);
      setIsVerifyModalOpen(false);
      setVerifyPassword("");
      setStatusMsg({ type: "success", text: "Settings unlocked. You can now edit and save company details." });
    } catch (err: any) {
      console.error(err);
      setVerifyError(err.message || "Incorrect password. Permission denied.");
    } finally {
      setVerifyLoading(false);
    }
  };

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
      setIsEditable(false);
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
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800/40 dark:text-emerald-400"
                    : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800/40 dark:text-red-400"
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
                <Card isGlass={true} className="border-border/60">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <Building className="text-secondary w-5 h-5" /> Company Profile
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Official registration details used on tax invoices and work orders.
                        </CardDescription>
                      </div>
                      <div>
                        {!isEditable ? (
                          <button
                            type="button"
                            onClick={() => { setVerifyError(null); setVerifyPassword(""); setIsVerifyModalOpen(true); }}
                            className="px-4 py-2 text-xs font-black bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs uppercase tracking-wider"
                          >
                            <Lock className="w-3.5 h-3.5" /> Edit Profile
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsEditable(false)}
                            className="px-4 py-2 text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center gap-1.5 cursor-pointer uppercase tracking-wider hover:bg-emerald-500/25 transition-all"
                          >
                            <Unlock className="w-3.5 h-3.5 animate-pulse" /> Lock Fields
                          </button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-secondary" /> Company Legal Name
                        </label>
                        <Input required placeholder="B.K. Engineering Works" disabled={!isEditable} {...register("name")} className="text-xs font-semibold focus:border-secondary focus:ring-secondary/20 transition-all duration-300 disabled:opacity-85 disabled:bg-muted/40" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-secondary" /> GSTIN (Tax ID)
                        </label>
                        <Input placeholder="29XXXXX0000X0Z0" disabled={!isEditable} {...register("gstin")} className="text-xs font-mono uppercase font-semibold focus:border-secondary focus:ring-secondary/20 transition-all duration-300 disabled:opacity-85 disabled:bg-muted/40" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-secondary" /> PAN Number
                        </label>
                        <Input placeholder="ABCDE1234F" disabled={!isEditable} {...register("pan")} className="text-xs font-mono uppercase font-semibold focus:border-secondary focus:ring-secondary/20 transition-all duration-300 disabled:opacity-85 disabled:bg-muted/40" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-secondary" /> Invoice ID Prefix
                        </label>
                        <Input placeholder="BK" disabled={!isEditable} {...register("invoicePrefix")} className="text-xs font-mono uppercase font-semibold focus:border-secondary focus:ring-secondary/20 transition-all duration-300 disabled:opacity-85 disabled:bg-muted/40" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-secondary" /> Registered Address
                      </label>
                      <Textarea required placeholder="Shop No. 5, Industrial Area, Bangalore" disabled={!isEditable} {...register("address")} className="text-xs min-h-[70px] font-semibold focus:border-secondary focus:ring-secondary/20 transition-all duration-300 disabled:opacity-85 disabled:bg-muted/40" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-secondary" /> State
                        </label>
                        <select
                          disabled={!isEditable}
                          {...register("state")}
                          className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground font-semibold focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none transition-all duration-300 disabled:opacity-85 disabled:bg-muted/40"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-secondary" /> Email Contact
                        </label>
                        <Input placeholder="contact@bkengineering.com" disabled={!isEditable} {...register("email")} className="text-xs font-semibold focus:border-secondary focus:ring-secondary/20 transition-all duration-300 disabled:opacity-85 disabled:bg-muted/40" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-secondary" /> Phone Number
                        </label>
                        <Input placeholder="+91 9876543210" disabled={!isEditable} {...register("phone")} className="text-xs font-semibold focus:border-secondary focus:ring-secondary/20 transition-all duration-300 disabled:opacity-85 disabled:bg-muted/40" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Banking & Terms */}
                <Card isGlass={true} className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Landmark className="text-secondary w-5 h-5" /> Banking & Legal Defaults
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Default bank accounts added to invoice footers and legal disclaimer clauses.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                          <Landmark className="w-3.5 h-3.5 text-secondary" /> Beneficiary Bank Name
                        </label>
                        <Input placeholder="State Bank of India" disabled={!isEditable} {...register("bankName")} className="text-xs font-semibold focus:border-secondary focus:ring-secondary/20 transition-all duration-300 disabled:opacity-85 disabled:bg-muted/40" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-secondary" /> Bank Account Number
                        </label>
                        <Input placeholder="300012345678" disabled={!isEditable} {...register("bankAccount")} className="text-xs font-mono font-semibold focus:border-secondary focus:ring-secondary/20 transition-all duration-300 disabled:opacity-85 disabled:bg-muted/40" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                          <Code className="w-3.5 h-3.5 text-secondary" /> Bank IFSC Code
                        </label>
                        <Input placeholder="SBIN0000123" disabled={!isEditable} {...register("ifsc")} className="text-xs font-mono uppercase font-semibold focus:border-secondary focus:ring-secondary/20 transition-all duration-300 disabled:opacity-85 disabled:bg-muted/40" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                          <QrCode className="w-3.5 h-3.5 text-secondary" /> UPI QR ID (optional)
                        </label>
                        <Input placeholder="bkengineering@sbi" disabled={!isEditable} {...register("upiId")} className="text-xs font-mono font-semibold focus:border-secondary focus:ring-secondary/20 transition-all duration-300 disabled:opacity-85 disabled:bg-muted/40" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-secondary" /> Invoice Disclaimer / T&C Clauses
                      </label>
                      <Textarea placeholder="1. Interest @18% will be charged if payment is not received within 15 days..." disabled={!isEditable} {...register("termsDefault")} className="text-xs min-h-[80px] font-semibold focus:border-secondary focus:ring-secondary/20 transition-all duration-300 disabled:opacity-85 disabled:bg-muted/40" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Assets & Backups */}
              <div className="space-y-8">
                {/* Branding Assets */}
                <Card isGlass={true} className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Sparkles className="text-secondary w-5 h-5" /> Branding Signatures
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Official graphic assets rendered in PDF tax slips.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Logo Upload */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-foreground">Company Logo</span>
                      <div className={`border-2 border-dashed border-border/80 dark:border-slate-800 rounded-2xl p-4 relative group flex flex-col items-center justify-center min-h-[140px] transition-all shadow-xs duration-300 ${isEditable ? 'hover:border-secondary/80 hover:bg-slate-50/20 dark:hover:bg-slate-900/30 cursor-pointer' : 'opacity-85'}`}>
                        {logoPreview ? (
                          <div className="text-center space-y-2">
                            <div className="relative inline-block rounded-lg overflow-hidden border border-border p-1.5 bg-white shadow-xs">
                              <img src={logoPreview} alt="Logo" className="max-h-16 object-contain" />
                            </div>
                            {isEditable && (
                              <div>
                                <button
                                  type="button"
                                  onClick={() => { setLogoPreview(null); setValue("logoUrl", ""); }}
                                  className="px-3 py-1 text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 rounded-full transition-all cursor-pointer border border-red-200 dark:border-red-800/40 flex items-center gap-1 mx-auto"
                                >
                                  <Trash2 size={10} /> Remove Logo
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            {isEditable ? (
                              <>
                                <Upload className="text-muted-foreground group-hover:text-secondary transition-colors mb-2" size={24} />
                                <span className="text-xs text-muted-foreground font-semibold">Click to upload Logo</span>
                              </>
                            ) : (
                              <>
                                <Lock className="text-muted-foreground mb-2" size={24} />
                                <span className="text-xs text-muted-foreground font-semibold">Upload Locked</span>
                              </>
                            )}
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={!isEditable}
                          onChange={(e) => handleFileChange(e, "logoUrl")}
                          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Signature Upload */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-foreground">Authorized Signature</span>
                      <div className={`border-2 border-dashed border-border/80 dark:border-slate-800 rounded-2xl p-4 relative group flex flex-col items-center justify-center min-h-[140px] transition-all shadow-xs duration-300 ${isEditable ? 'hover:border-secondary/80 hover:bg-slate-50/20 dark:hover:bg-slate-900/30 cursor-pointer' : 'opacity-85'}`}>
                        {signaturePreview ? (
                          <div className="text-center space-y-2">
                            <div className="relative inline-block rounded-lg overflow-hidden border border-border p-1.5 bg-white shadow-xs">
                              <img src={signaturePreview} alt="Signature" className="max-h-12 object-contain" />
                            </div>
                            {isEditable && (
                              <div>
                                <button
                                  type="button"
                                  onClick={() => { setSignaturePreview(null); setValue("signatureUrl", ""); }}
                                  className="px-3 py-1 text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 rounded-full transition-all cursor-pointer border border-red-200 dark:border-red-800/40 flex items-center gap-1 mx-auto"
                                >
                                  <Trash2 size={10} /> Remove Signature
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            {isEditable ? (
                              <>
                                <Upload className="text-muted-foreground group-hover:text-secondary transition-colors mb-2" size={24} />
                                <span className="text-xs text-muted-foreground font-semibold">Click to upload Signature</span>
                              </>
                            ) : (
                              <>
                                <Lock className="text-muted-foreground mb-2" size={24} />
                                <span className="text-xs text-muted-foreground font-semibold">Upload Locked</span>
                              </>
                            )}
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={!isEditable}
                          onChange={(e) => handleFileChange(e, "signatureUrl")}
                          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Seal Upload */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-foreground">Official Seal</span>
                      <div className={`border-2 border-dashed border-border/80 dark:border-slate-800 rounded-2xl p-4 relative group flex flex-col items-center justify-center min-h-[140px] transition-all shadow-xs duration-300 ${isEditable ? 'hover:border-secondary/80 hover:bg-slate-50/20 dark:hover:bg-slate-900/30 cursor-pointer' : 'opacity-85'}`}>
                        {sealPreview ? (
                          <div className="text-center space-y-2">
                            <div className="relative inline-block rounded-lg overflow-hidden border border-border p-1.5 bg-white shadow-xs">
                              <img src={sealPreview} alt="Seal" className="max-h-16 object-contain" />
                            </div>
                            {isEditable && (
                              <div>
                                <button
                                  type="button"
                                  onClick={() => { setSealPreview(null); setValue("sealUrl", ""); }}
                                  className="px-3 py-1 text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 rounded-full transition-all cursor-pointer border border-red-200 dark:border-red-800/40 flex items-center gap-1 mx-auto"
                                >
                                  <Trash2 size={10} /> Remove Seal
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            {isEditable ? (
                              <>
                                <Upload className="text-muted-foreground group-hover:text-secondary transition-colors mb-2" size={24} />
                                <span className="text-xs text-muted-foreground font-semibold">Click to upload Seal</span>
                              </>
                            ) : (
                              <>
                                <Lock className="text-muted-foreground mb-2" size={24} />
                                <span className="text-xs text-muted-foreground font-semibold">Upload Locked</span>
                              </>
                            )}
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={!isEditable}
                          onChange={(e) => handleFileChange(e, "sealUrl")}
                          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Database Backup & Restore Card */}
                <Card isGlass={true} className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Settings className="text-secondary w-4 h-4" /> Database Backup & Restore
                    </CardTitle>
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
                  {isEditable ? (
                    <>
                      <Button type="submit" variant="primary" className="w-full cursor-pointer hover:scale-[1.01] transition-transform duration-200 font-bold" isLoading={isLoading}>
                        Save Settings
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full cursor-pointer hover:scale-[1.01] transition-transform duration-200 font-bold"
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
                              setIsEditable(false);
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
                    </>
                  ) : (
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full cursor-pointer hover:scale-[1.01] transition-all duration-200 font-bold flex items-center justify-center gap-2 border-secondary/20 hover:bg-secondary/10 text-secondary"
                      onClick={() => { setVerifyError(null); setVerifyPassword(""); setIsVerifyModalOpen(true); }}
                    >
                      <Lock size={14} /> Unlock Profile to Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* ADMIN PASSWORD VERIFICATION MODAL */}
            {isVerifyModalOpen && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in duration-200">
                  <div className="flex items-center justify-between p-6 border-b border-border bg-slate-50/50 dark:bg-slate-900/20">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Lock size={18} className="text-secondary" />
                      Admin Verification Required
                    </h3>
                    <button 
                      type="button"
                      onClick={() => setIsVerifyModalOpen(false)} 
                      className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-muted-foreground">
                      To modify company settings or branding assets, please verify your administrator account password.
                    </p>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Admin Account</label>
                      <div className="text-xs font-mono font-bold bg-muted px-3 py-2 rounded-lg text-foreground border border-border">
                        {currentUserEmail}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Verify Password</label>
                      <Input
                        type="password"
                        required
                        placeholder="Enter password..."
                        value={verifyPassword}
                        onChange={(e) => setVerifyPassword(e.target.value)}
                        className="text-xs font-semibold focus:border-secondary focus:ring-secondary/20"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleVerifyAdmin(e as any);
                          }
                        }}
                        autoFocus
                      />
                    </div>

                    {verifyError && (
                      <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-xs font-semibold flex items-center gap-1.5">
                        <AlertCircle size={14} />
                        <span>{verifyError}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6 border-t border-border bg-slate-50/50 dark:bg-slate-900/20 flex justify-end gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsVerifyModalOpen(false)} 
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button"
                      onClick={(e) => handleVerifyAdmin(e as any)}
                      className="cursor-pointer font-bold" 
                      isLoading={verifyLoading}
                    >
                      Verify & Unlock
                    </Button>
                  </div>
                </div>
              </div>
            )}
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

  // Loading triggers for individual actions
  const [loadingUserId, setLoadingUserId] = React.useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = React.useState<string | null>(null);
  const [revokingAccessId, setRevokingAccessId] = React.useState<string | null>(null);

  // Invite user state
  const [newUser, setNewUser] = React.useState({
    email: "",
    name: "",
    phone: "",
    role: "SITE_MANAGER"
  });

  // Access assignment state with extended permissions list
  const [newAccess, setNewAccess] = React.useState({
    contractId: "",
    siteId: "", // empty means All Sites
    permissions: {
      attendance: true,
      measurement: true,
      materialRequest: true,
      laborDeployment: true,
      workerManagement: true,
      expenseRecording: true,
      documentUpload: true,
      viewProgress: true
    }
  });

  const PERMISSION_LABELS: Record<string, string> = {
    attendance: "Daily Attendance",
    measurement: "Measurement Sheets",
    materialRequest: "Material Requests",
    laborDeployment: "Labor Deployment Logs",
    workerManagement: "Worker Directory Access",
    expenseRecording: "Log Site Expenses",
    documentUpload: "Upload Drawings/Docs",
    viewProgress: "View Progress Reports",
  };

  const sessionStr = typeof window !== "undefined" ? localStorage.getItem("bk_session") : null;
  const token = sessionStr ? JSON.parse(sessionStr).token : "";

  const handleResendInvite = async (email: string) => {
    setStatusMsg(null);
    setResendingEmail(email);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login/reset-password`,
      });

      if (error) throw error;
      setStatusMsg({ type: "success", text: `Password setup link successfully sent to ${email}!` });
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: "error", text: `Failed to send setup link: ${err.message}` });
    } finally {
      setResendingEmail(null);
    }
  };

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
    setLoadingUserId(id);
    setStatusMsg(null);
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
        setStatusMsg({ type: "success", text: `User status changed to ${nextStatus} successfully.` });
        loadData();
      } else {
        const err = await res.json();
        setStatusMsg({ type: "error", text: err.error || "Failed to toggle status" });
      }
    } catch (e: any) {
      console.error(e);
      setStatusMsg({ type: "error", text: e.message || "Failed to toggle user status." });
    } finally {
      setLoadingUserId(null);
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
          permissions: {
            attendance: true,
            measurement: true,
            materialRequest: true,
            laborDeployment: true,
            workerManagement: true,
            expenseRecording: true,
            documentUpload: true,
            viewProgress: true
          }
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
    setRevokingAccessId(accessId);
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
    } finally {
      setRevokingAccessId(null);
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

                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {userItem.role !== "ADMIN" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs font-semibold cursor-pointer gap-1.5"
                            onClick={() => setSelectedUserId(selectedUserId === userItem.id ? "" : userItem.id)}
                            disabled={loadingUserId !== null || resendingEmail !== null}
                          >
                            <Settings size={12} />
                            Permissions ({userItem.siteAccess?.length || 0})
                          </Button>
                        )}
                        <Button
                          size="sm"
                          type="button"
                          variant="outline"
                          className="text-xs font-semibold cursor-pointer gap-1.5 border-amber-200 hover:bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:hover:bg-amber-950/20 dark:text-amber-400 min-w-[110px] justify-center"
                          onClick={() => handleResendInvite(userItem.email)}
                          disabled={resendingEmail !== null || loadingUserId !== null}
                        >
                          {resendingEmail === userItem.email ? (
                            <Loader2 size={12} className="animate-spin text-amber-600" />
                          ) : (
                            <Mail size={12} />
                          )}
                          {resendingEmail === userItem.email ? "Sending..." : "Resend Link"}
                        </Button>
                        <Button
                          size="sm"
                          variant={isUserActive ? "danger" : "outline"}
                          className="text-xs font-semibold cursor-pointer gap-1.5 min-w-[100px] justify-center"
                          onClick={() => handleToggleStatus(userItem.id, userItem.status)}
                          disabled={loadingUserId !== null || resendingEmail !== null}
                        >
                          {loadingUserId === userItem.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : isUserActive ? (
                            <Lock size={12} />
                          ) : (
                            <Unlock size={12} />
                          )}
                          {loadingUserId === userItem.id ? "Processing" : (isUserActive ? "Deactivate" : "Activate")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Selected User Perm Controls */}
            {selectedUserId && activeUser && (
              <Card className="border-border border-2 shadow-md animate-in fade-in duration-200">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-card p-3 rounded-xl border border-border">
                        {Object.keys(newAccess.permissions).map((permKey) => {
                          const val = (newAccess.permissions as any)[permKey];
                          return (
                            <label key={permKey} className="flex items-center gap-2 bg-background p-2.5 border border-border/80 hover:border-secondary/40 rounded-lg cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={val}
                                onChange={(e) => setNewAccess(p => ({
                                  ...p,
                                  permissions: { ...p.permissions, [permKey]: e.target.checked }
                                }))}
                                className="w-3.5 h-3.5 text-secondary accent-amber-500 rounded focus:ring-secondary/20"
                              />
                              <span className="text-xs font-semibold text-foreground">{PERMISSION_LABELS[permKey] || permKey}</span>
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
                                <p className="text-[10px] text-muted-foreground font-medium">
                                  Site: <span className="font-bold text-foreground">{accessItem.site?.name || "ALL SITES UNDER CONTRACT"}</span>
                                </p>
                                <div className="flex gap-1.5 flex-wrap pt-2">
                                  {Object.entries(perms).map(([k, v]) => v ? (
                                    <span key={k} className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider">
                                      {PERMISSION_LABELS[k] || k.replace(/([A-Z])/g, " $1")}
                                    </span>
                                  ) : null)}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="danger"
                                className="text-xs gap-1 cursor-pointer min-w-[80px] justify-center"
                                onClick={() => handleRevokeAccess(accessItem.id)}
                                disabled={revokingAccessId !== null}
                              >
                                {revokingAccessId === accessItem.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Trash2 size={12} />
                                )}
                                {revokingAccessId === accessItem.id ? "Revoking" : "Revoke"}
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
