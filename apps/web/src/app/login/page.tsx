"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

type LoginFields = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Forgot password flow states
  const [view, setView] = React.useState<"login" | "forgot" | "success">("login");
  const [forgotEmail, setForgotEmail] = React.useState("");
  const [forgotError, setForgotError] = React.useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFields) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Fetch user profile to verify status and role
      const profileRes = await fetch(`/api/users/profile?email=${encodeURIComponent(data.email)}`);
      const profile = await profileRes.json();

      if (!profileRes.ok || !profile) {
        throw new Error(profile?.error || "You are not authorized to log into this ERP.");
      }

      if (profile.status === "INACTIVE") {
        throw new Error("Your account is deactivated. Please contact the administrator.");
      }

      // Real Supabase Authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        throw authError;
      }

      const sessionToken = authData.session?.access_token || "";

      localStorage.setItem("bk_session", JSON.stringify({
        user: { 
          id: profile.id, 
          email: profile.email, 
          name: profile.name,
          role: profile.role,
          status: profile.status
        },
        token: sessionToken,
        isMock: false
      }));

      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotError("Please enter a valid email address");
      return;
    }
    setForgotLoading(true);
    setForgotError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/login/reset-password`,
      });

      if (error) {
        throw error;
      }

      setView("success");
    } catch (err: any) {
      console.error(err);
      setForgotError(err.message || "Failed to send reset link. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-background overflow-y-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Background industrial grid ornament */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] opacity-35" />

      {/* Embedded CSS animations */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(15px, -15px); }
        }
        .animate-fade-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        .animate-float-1 {
          animation: float-slow 10s ease-in-out infinite;
        }
      `}</style>

      {/* Decorative background blur objects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-secondary/5 blur-3xl animate-float-1 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-float-1 pointer-events-none" style={{ animationDelay: '-5s' }} />

      {/* Centered layout container - Unified Canvas */}
      <div className="w-full max-w-6xl z-10 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-12 lg:gap-20 p-4 animate-fade-up">
        
        {/* Left side: Branding Info */}
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
          <div className="flex justify-center animate-bounce-slow">
            <Logo size={160} showText={false} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground whitespace-nowrap">
              B.K. Engineering Works
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground font-medium max-w-md mx-auto">
              Enterprise Resource Planning & GST Invoicing Portal
            </p>
          </div>

          {/* Industrial Expertise Grid */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-md text-left mx-auto">
            {/* Pipeline */}
            <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-sm hover:border-secondary transition-all">
              <div className="p-2.5 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 flex-shrink-0 shadow-xs">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M2 9h8v6H2zM14 9h8v6h-8z" />
                  <path d="M10 12h4M6 9v6M18 9v6" />
                  <circle cx="12" cy="12" r="1" fill="currentColor" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-950 dark:text-slate-50">Pipeline & Piping</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-tight mt-0.5">Industrial pipelines & valves</p>
              </div>
            </div>

            {/* Welding */}
            <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-sm hover:border-secondary transition-all">
              <div className="p-2.5 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 flex-shrink-0 shadow-xs">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M4 20L13 11M11 9l4 4M14 10l6-6" />
                  <path d="M18 6h3M17 4v3M20 2l-1.5 1.5" className="animate-pulse" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-950 dark:text-slate-50">Welding & Fabrication</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-tight mt-0.5">Heavy structural welding</p>
              </div>
            </div>

            {/* Plant Erection */}
            <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-sm hover:border-secondary transition-all">
              <div className="p-2.5 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 flex-shrink-0 shadow-xs">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M3 21h18M5 21v-8l4 3v-5l4 3V7l4 4v10" />
                  <path d="M17 12h4M19 12l1.5-3h-3zM20 9v12" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-950 dark:text-slate-50">Plant Erection</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-tight mt-0.5">Factory setup & structures</p>
              </div>
            </div>

            {/* Fabrication */}
            <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-sm hover:border-secondary transition-all">
              <div className="p-2.5 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 flex-shrink-0 shadow-xs">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M6 3h12M6 21h12M12 3v18M9 7h6M9 17h6" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-950 dark:text-slate-50">Heavy Fabrication</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-tight mt-0.5">Precision steel products</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Login Section Card */}
        <div className="w-full max-w-lg lg:max-w-xl flex-shrink-0">
          <Card isGlass={true} className="border border-border/80 shadow-2xl p-8 sm:p-10 lg:p-12 backdrop-blur-xl">
            {view === "login" && (
              <>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
                  <CardDescription className="text-base">
                    Enter your credentials to access the ERP dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {errorMsg && (
                      <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm font-semibold">
                        {errorMsg}
                      </div>
                    )}

                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="owner@bkengineering.com"
                      error={errors.email?.message}
                      className="h-12 text-lg"
                      {...register("email")}
                    />

                    <div className="space-y-1">
                      <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        error={errors.password?.message}
                        className="h-12 text-lg"
                        {...register("password")}
                      />
                      <div className="flex items-center justify-end text-sm pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setForgotEmail("");
                            setForgotError(null);
                            setView("forgot");
                          }}
                          className="font-semibold text-secondary hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg" isLoading={isLoading}>
                      Log In
                    </Button>
                  </form>
                </CardContent>
              </>
            )}

            {view === "forgot" && (
              <>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                  <CardDescription className="text-base">
                    Enter your email address and we will send you a link to reset your password.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleForgotSubmit} className="space-y-6">
                    {forgotError && (
                      <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm font-semibold">
                        {forgotError}
                      </div>
                    )}

                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="owner@bkengineering.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="h-12 text-lg"
                    />

                    <div className="space-y-3">
                      <Button type="submit" className="w-full h-12 text-lg" isLoading={forgotLoading}>
                        Send Reset Link
                      </Button>
                      <button
                        type="button"
                        onClick={() => setView("login")}
                        className="w-full text-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                </CardContent>
              </>
            )}

            {view === "success" && (
              <>
                <CardHeader>
                  <div className="flex justify-center mb-2">
                    <div className="h-14 w-14 rounded-full bg-success/15 flex items-center justify-center text-success">
                      <svg className="h-8 w-8 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <CardTitle className="text-center text-2xl font-bold">Reset Link Sent</CardTitle>
                  <CardDescription className="text-center text-base">
                    Check your email account for password recovery instructions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-base text-center text-muted-foreground leading-relaxed">
                    We have dispatched a verification email to <strong className="text-foreground">{forgotEmail}</strong>.
                    Please follow the instructions inside the message to restore access to your account.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 text-lg"
                    onClick={() => setView("login")}
                  >
                    Back to Sign In
                  </Button>
                </CardContent>
              </>
            )}

            <CardFooter className="flex-col items-stretch text-center gap-2">
              <span className="text-xs text-muted-foreground">
                Single-Owner Portal &bull; Phase 0 Foundation Version
              </span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
