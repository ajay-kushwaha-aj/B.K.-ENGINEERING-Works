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

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative min-h-screen">
      {/* Background industrial grid ornament */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] opacity-40" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <Logo size={60} showText={false} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-foreground">
          B.K. Engineering Works
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          ERP & GST Invoicing Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <Card isGlass={true} className="border border-border/80">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your email and password to access the ERP dashboard</CardDescription>
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
                {...register("email")}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password")}
              />



              <Button type="submit" className="w-full" isLoading={isLoading}>
                Log In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col items-stretch text-center gap-2">
            <span className="text-xs text-muted-foreground">
              Single-Owner Portal &bull; Phase 0 Foundation Version
            </span>

          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
