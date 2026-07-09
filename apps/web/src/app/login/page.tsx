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
  const [useMock, setUseMock] = React.useState(false);

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
      // Check if Supabase keys are placeholder
      const isPlaceholder = 
        !process.env.NEXT_PUBLIC_SUPABASE_URL || 
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-url");

      if (isPlaceholder || useMock) {
        // Fallback Mock Login for local testing
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        // Save mock session
        localStorage.setItem("bk_session", JSON.stringify({
          user: { email: data.email, name: "Owner" },
          token: "mock-jwt-token",
          isMock: true
        }));
        
        router.push("/dashboard");
        return;
      }

      // Real Supabase Authentication
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

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

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="use-mock"
                    name="use-mock"
                    type="checkbox"
                    checked={useMock}
                    onChange={(e) => setUseMock(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-secondary focus:ring-secondary cursor-pointer"
                  />
                  <label htmlFor="use-mock" className="ml-2 block text-sm text-muted-foreground cursor-pointer select-none">
                    Use Mock Login (For Local Sandbox Verification)
                  </label>
                </div>
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Log In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col items-stretch text-center gap-2">
            <span className="text-xs text-muted-foreground">
              Single-Owner Portal &bull; Phase 0 Foundation Version
            </span>
            <div className="text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 p-2 rounded border border-amber-200/50">
              Tip: If you do not have Supabase set up yet, check the &quot;Use Mock Login&quot; box and log in with any email/password.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
