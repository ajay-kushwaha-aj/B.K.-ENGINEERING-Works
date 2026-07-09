"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/logo";

export default function RootPage() {
  const router = useRouter();

  React.useEffect(() => {
    // Check if user session exists in Local Storage
    const session = localStorage.getItem("bk_session");
    if (session) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white relative">
      {/* Background radial highlight */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
      
      <div className="z-10 text-center flex flex-col items-center gap-4">
        <Logo size={80} showText={false} className="animate-pulse" />
        <h1 className="text-2xl font-bold tracking-wider">B.K. Engineering Works</h1>
        <p className="text-sm text-slate-400">Loading Billing System...</p>
        
        {/* Spinner */}
        <div className="mt-4">
          <svg className="animate-spin h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
