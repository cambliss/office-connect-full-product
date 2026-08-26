"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountechRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/akaunting");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#eef2fa]">
      <div className="flex items-center gap-3 rounded-xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#6678c1] border-t-transparent" />
        <span className="text-sm font-semibold text-[#1f2430]">Redirecting to Akaunting ERP Suite...</span>
      </div>
    </div>
  );
}
