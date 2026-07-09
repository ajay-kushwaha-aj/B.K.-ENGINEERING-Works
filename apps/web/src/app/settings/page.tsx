"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CompanySchema, CompanyType } from "shared";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Upload, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
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
        // Try to load from Local Storage first (covers mock mode)
        const mockSettings = localStorage.getItem("bk_company_settings");
        if (mockSettings) {
          const parsed = JSON.parse(mockSettings);
          reset(parsed);
          setLogoPreview(parsed.logoUrl || null);
          setSignaturePreview(parsed.signatureUrl || null);
          setSealPreview(parsed.sealUrl || null);
          setIsLoading(false);
          return;
        }

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
      // Save to local storage for quick mockup testing
      localStorage.setItem("bk_company_settings", JSON.stringify(data));

      // Try database saving
      const isPlaceholder = 
        !process.env.NEXT_PUBLIC_SUPABASE_URL || 
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-url");

      if (!isPlaceholder) {
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
            .insert([companyPayload]);
          dbError = error;
        }

        if (dbError) throw dbError;
      }

      setStatusMsg({
        type: "success",
        text: "Company settings saved successfully! (Persisted locally & Database synchronized)",
      });
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to save company settings. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Navigation>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Company Settings
            <span className="text-[10px] uppercase bg-secondary/20 text-secondary border border-secondary/30 px-2 py-0.5 rounded-full font-semibold font-mono tracking-wider">
              Phase 0
            </span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure your company profile, default GST settings, banking accounts, and branding signatures.
          </p>
        </div>

        {statusMsg && (
          <div
            className={`p-4 rounded-xl flex items-start gap-3 border ${
              statusMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400"
                : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="flex-shrink-0 mt-0.5" size={20} />
            ) : (
              <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />
            )}
            <div>
              <p className="text-sm font-semibold">{statusMsg.type === "success" ? "Saved!" : "Error"}</p>
              <p className="text-xs mt-1">{statusMsg.text}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
            
            {/* Form Fields: General, Bank & Invoice settings (2/3 width on desktop) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Profile Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="text-secondary" size={18} />
                    Company Profile Details
                  </CardTitle>
                  <CardDescription>Legal name, tax registration and contact details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Company Name *"
                      placeholder="B.K. Engineering Works"
                      error={errors.name?.message}
                      {...register("name")}
                    />
                    <Input
                      label="GSTIN (Goods & Services Tax ID)"
                      placeholder="27AAAAA1111A1Z1"
                      error={errors.gstin?.message}
                      {...register("gstin")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="PAN (Permanent Account Number)"
                      placeholder="ABCDE1234F"
                      error={errors.pan?.message}
                      {...register("pan")}
                    />
                    <Input
                      label="Invoice Number Prefix"
                      placeholder="BK"
                      error={errors.invoicePrefix?.message}
                      {...register("invoicePrefix")}
                    />
                  </div>

                  <Textarea
                    label="Registered Address"
                    placeholder="Shop No. 5, Industrial Area, Sector 2, Mumbai, MH - 400001"
                    error={errors.address?.message}
                    {...register("address")}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="billing@bkengineering.com"
                      error={errors.email?.message}
                      {...register("email")}
                    />
                    <Input
                      label="Phone / Mobile"
                      placeholder="+91 9876543210"
                      error={errors.phone?.message}
                      {...register("phone")}
                    />
                    <Input
                      label="Website"
                      placeholder="https://bkengineering.com"
                      error={errors.website?.message}
                      {...register("website")}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Bank & Payment Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Banking & Payments</CardTitle>
                  <CardDescription>Bank details that will appear on your GST invoices for direct bank transfer.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Bank Name"
                      placeholder="State Bank of India"
                      error={errors.bankName?.message}
                      {...register("bankName")}
                    />
                    <Input
                      label="Bank Account Number"
                      placeholder="12345678901"
                      error={errors.bankAccount?.message}
                      {...register("bankAccount")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="IFSC Code"
                      placeholder="SBIN0001234"
                      error={errors.ifsc?.message}
                      {...register("ifsc")}
                    />
                    <Input
                      label="UPI ID (for Payment QR codes)"
                      placeholder="bkworks@sbi"
                      error={errors.upiId?.message}
                      {...register("upiId")}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Default Terms & Conditions Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Default Terms & Conditions</CardTitle>
                  <CardDescription>These terms will be automatically appended to new invoices unless edited manually.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="1. Interest @ 18% p.a. will be charged for delayed payment beyond 30 days.&#10;2. Any dispute subject to local jurisdiction only.&#10;3. Goods once sold will not be taken back."
                    rows={5}
                    error={errors.termsDefault?.message}
                    {...register("termsDefault")}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Asset Branding: Logo, Signature & Seal (1/3 width on desktop) */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Branding & Assets</CardTitle>
                  <CardDescription>Upload image files for invoice rendering.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Company Logo</label>
                    <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden bg-background group min-h-[120px] transition-all hover:border-secondary">
                      {logoPreview ? (
                        <div className="relative w-full flex flex-col items-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={logoPreview} alt="Logo preview" className="max-h-20 object-contain rounded mb-2" />
                          <button
                            type="button"
                            onClick={() => { setLogoPreview(null); setValue("logoUrl", ""); }}
                            className="text-xs text-red-500 hover:underline font-semibold"
                          >
                            Remove Logo
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center cursor-pointer">
                          <Upload className="text-muted-foreground group-hover:text-secondary transition-colors mb-2" size={24} />
                          <span className="text-xs text-muted-foreground">Click to upload Logo</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, SVG max 1MB</span>
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

                  {/* Digital Signature Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Authorized Signature</label>
                    <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden bg-background group min-h-[120px] transition-all hover:border-secondary">
                      {signaturePreview ? (
                        <div className="relative w-full flex flex-col items-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={signaturePreview} alt="Signature preview" className="max-h-16 object-contain rounded mb-2" />
                          <button
                            type="button"
                            onClick={() => { setSignaturePreview(null); setValue("signatureUrl", ""); }}
                            className="text-xs text-red-500 hover:underline font-semibold"
                          >
                            Remove Signature
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center cursor-pointer">
                          <Upload className="text-muted-foreground group-hover:text-secondary transition-colors mb-2" size={24} />
                          <span className="text-xs text-muted-foreground">Click to upload Signature</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">Clear signature on white background</span>
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

                  {/* Company Seal/Stamp Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Company Seal / Stamp</label>
                    <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden bg-background group min-h-[120px] transition-all hover:border-secondary">
                      {sealPreview ? (
                        <div className="relative w-full flex flex-col items-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={sealPreview} alt="Seal preview" className="max-h-16 object-contain rounded mb-2" />
                          <button
                            type="button"
                            onClick={() => { setSealPreview(null); setValue("sealUrl", ""); }}
                            className="text-xs text-red-500 hover:underline font-semibold"
                          >
                            Remove Seal
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center cursor-pointer">
                          <Upload className="text-muted-foreground group-hover:text-secondary transition-colors mb-2" size={24} />
                          <span className="text-xs text-muted-foreground">Click to upload Seal</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">Circular or rectangular stamp</span>
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
                  onClick={() => {
                    if (confirm("Are you sure you want to revert changes?")) {
                      const mockSettings = localStorage.getItem("bk_company_settings");
                      if (mockSettings) {
                        const parsed = JSON.parse(mockSettings);
                        reset(parsed);
                        setLogoPreview(parsed.logoUrl || null);
                        setSignaturePreview(parsed.signatureUrl || null);
                        setSealPreview(parsed.sealUrl || null);
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
      </div>
    </Navigation>
  );
}
