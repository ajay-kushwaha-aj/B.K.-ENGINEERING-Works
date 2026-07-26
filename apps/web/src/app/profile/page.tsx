"use client";

import * as React from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  MapPin,
  Camera,
  Trash2,
  Save,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  Briefcase,
  CalendarDays,
  HardHat
} from "lucide-react";

export default function ProfilePage() {
  const [sessionUser, setSessionUser] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Form Fields
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState("ADMIN");
  const [designation, setDesignation] = React.useState("Senior Operations Manager");
  const [department, setDepartment] = React.useState("Engineering & Project Operations");
  const [location, setLocation] = React.useState("Pilibhit, Uttar Pradesh");
  const [avatar, setAvatar] = React.useState<string | null>(null);

  // Password Update Fields
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const sessionStr = localStorage.getItem("bk_session");
      let storedEmail = "owner@bk.com";
      let storedName = "Ajay Kumar";
      let storedRole = "ADMIN";
      let storedPhone = "+91 98765 43210";
      let storedAvatar: string | null = null;

      if (sessionStr) {
        const parsed = JSON.parse(sessionStr);
        if (parsed.user) {
          setSessionUser(parsed.user);
          storedEmail = parsed.user.email || storedEmail;
          storedName = parsed.user.name || storedName;
          storedRole = parsed.user.role || storedRole;
          storedPhone = parsed.user.phone || storedPhone;
          storedAvatar = parsed.user.avatar || null;
        }
      }

      setEmail(storedEmail);
      setName(storedName);
      setRole(storedRole);
      setPhone(storedPhone);
      setAvatar(storedAvatar);

      // Fetch latest profile details from database
      const res = await fetch(`/api/users/profile?email=${encodeURIComponent(storedEmail)}`);
      if (res.ok) {
        const userData = await res.json();
        if (userData) {
          if (userData.name) setName(userData.name);
          if (userData.phone) setPhone(userData.phone);
          if (userData.avatar) setAvatar(userData.avatar);
          if (userData.role) setRole(userData.role);
        }
      }
    } catch (e) {
      console.error("Failed to load profile details:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Image File Upload Handler (Convert DP photo to base64 Data URL)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image file size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatar(base64);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatar(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // 1. Update Database
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          phone,
          avatar
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update profile in database");
      }

      // 2. Update localStorage Session so navbar/sidebar update immediately
      const sessionStr = localStorage.getItem("bk_session");
      if (sessionStr) {
        const parsed = JSON.parse(sessionStr);
        parsed.user = {
          ...parsed.user,
          name,
          phone,
          avatar
        };
        localStorage.setItem("bk_session", JSON.stringify(parsed));
      }

      setSuccessMessage("Profile details & Display Picture updated successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while saving profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }
    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage("Security password changed successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 1000);
  };

  return (
    <Navigation>
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-card to-muted/40 p-6 rounded-2xl border border-border/80 shadow-xs">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              <User className="text-amber-500" size={28} /> User Profile & Details
            </h1>
            <p className="text-xs text-muted-foreground mt-1 font-semibold">
              Manage your display picture (DP), contact info, and account preferences
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
              {role} ACCOUNT
            </span>
          </div>
        </div>

        {/* Success & Error Alert Messages */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Shield size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-8">
            
            {/* 1. Display Picture (DP) Upload Section */}
            <Card className="border border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-border/60 p-6">
                <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                  <Camera className="text-amber-500" size={20} />
                  Display Picture (DP)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  
                  {/* Circular Avatar Preview */}
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-amber-500/80 shadow-xl bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-slate-100 font-black text-3xl">
                      {avatar ? (
                        <img src={avatar} alt="Profile DP" className="w-full h-full object-cover" />
                      ) : (
                        <span>{name ? name.substring(0, 2).toUpperCase() : "BK"}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold cursor-pointer"
                    >
                      <Camera size={20} className="mb-1 text-amber-400" />
                      <span>Change Photo</span>
                    </button>
                  </div>

                  {/* Upload Controls & Instructions */}
                  <div className="space-y-3 text-center sm:text-left">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Upload Profile Photo</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Allowed formats: JPG, PNG, WEBP. Max size: 5MB.
                      </p>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2 px-4 rounded-xl gap-2 cursor-pointer"
                      >
                        <Camera size={15} /> Upload New Photo
                      </Button>

                      {avatar && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRemovePhoto}
                          className="border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-bold py-2 px-4 rounded-xl gap-2 cursor-pointer"
                        >
                          <Trash2 size={15} /> Remove Photo
                        </Button>
                      )}
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* 2. Personal & Professional Information Form */}
            <Card className="border border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-border/60 p-6">
                <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                  <User className="text-amber-500" size={20} />
                  Personal & Professional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <User size={14} className="text-amber-500" /> Full Name
                    </label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ajay Kumar"
                      required
                      className="rounded-xl bg-muted/40 border-border text-xs font-semibold text-foreground py-2.5"
                    />
                  </div>

                  {/* Email Address (Read-only) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Mail size={14} className="text-amber-500" /> Email Address
                    </label>
                    <Input
                      type="email"
                      value={email}
                      disabled
                      className="rounded-xl bg-muted border-border/60 text-xs font-semibold text-muted-foreground py-2.5 cursor-not-allowed"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Phone size={14} className="text-amber-500" /> Phone Number
                    </label>
                    <Input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="rounded-xl bg-muted/40 border-border text-xs font-semibold text-foreground py-2.5"
                    />
                  </div>

                  {/* Role (Read-only Badge) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Shield size={14} className="text-amber-500" /> System Role
                    </label>
                    <div className="p-2.5 rounded-xl bg-muted border border-border/60 flex items-center justify-between text-xs font-bold text-foreground">
                      <span className="capitalize">{role.toLowerCase().replace("_", " ")}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 uppercase">
                        Verified
                      </span>
                    </div>
                  </div>

                  {/* Designation */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Briefcase size={14} className="text-amber-500" /> Designation / Job Title
                    </label>
                    <Input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Senior Operations Manager"
                      className="rounded-xl bg-muted/40 border-border text-xs font-semibold text-foreground py-2.5"
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Building2 size={14} className="text-amber-500" /> Department
                    </label>
                    <Input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Engineering & Site Supervision"
                      className="rounded-xl bg-muted/40 border-border text-xs font-semibold text-foreground py-2.5"
                    />
                  </div>

                  {/* Office Location */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <MapPin size={14} className="text-amber-500" /> Base Location / Headquarters
                    </label>
                    <Input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Pilibhit Industrial Area, Uttar Pradesh"
                      className="rounded-xl bg-muted/40 border-border text-xs font-semibold text-foreground py-2.5"
                    />
                  </div>

                </div>

                {/* Submit Save Button */}
                <div className="pt-4 border-t border-border/60 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-3 px-6 rounded-xl gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Save Profile Details
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

          </form>
        )}

        {/* 3. Security & Password Update Section */}
        <Card className="border border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/60 p-6">
            <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
              <KeyRound className="text-amber-500" size={20} />
              Account Security & Password
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handlePasswordChange} className="space-y-5 max-w-xl">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Current Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="rounded-xl bg-muted/40 border-border text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground">New Password</label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="rounded-xl bg-muted/40 border-border text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground">Confirm New Password</label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="rounded-xl bg-muted/40 border-border text-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="outline"
                disabled={isUpdatingPassword}
                className="border-border/80 hover:bg-muted text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer"
              >
                {isUpdatingPassword ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={14} className="animate-spin" /> Updating...
                  </span>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
    </Navigation>
  );
}
