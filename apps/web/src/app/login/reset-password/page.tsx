"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters long"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetFields = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFields>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetFields) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update password. The link might have expired.");
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
          <Logo size={120} showText={false} />
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
          {!success ? (
            <>
              <CardHeader>
                <CardTitle>Set New Password</CardTitle>
                <CardDescription>Enter your new password below to regain access.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {errorMsg && (
                    <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm font-semibold">
                      {errorMsg}
                    </div>
                  )}

                  <Input
                    label="New Password"
                    type="password"
                    placeholder="••••••••"
                    error={errors.password?.message}
                    {...register("password")}
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="••••••••"
                    error={errors.confirmPassword?.message}
                    {...register("confirmPassword")}
                  />

                  <Button type="submit" className="w-full" isLoading={isLoading}>
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <div className="flex justify-center mb-2">
                  <div className="h-12 w-12 rounded-full bg-success/15 flex items-center justify-center text-success">
                    <svg className="h-6 w-6 stroke-current" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <CardTitle className="text-center">Password Updated</CardTitle>
                <CardDescription className="text-center text-success font-medium">
                  Your password has been successfully reset!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-center text-muted-foreground">
                  You will be automatically redirected to the sign-in page in a few seconds...
                </p>
                <Button
                  type="button"
                  className="w-full mt-6"
                  onClick={() => router.push("/login")}
                >
                  Redirect Now
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
