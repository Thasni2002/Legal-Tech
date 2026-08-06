"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLoggedInUser } from "@/utils/auth";

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getLoggedInUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const role = (user.role || "").toLowerCase();
    if (role.includes("junior")) {
      router.replace("/assigned-tasks");
    } else if (role.includes("senior") || role.includes("admin")) {
      router.replace("/assigned-tasks");
    } else if (role.includes("clerk")) {
      router.replace("/clerk-dashboard");
    } else if (role.includes("client")) {
      router.replace("/client-dashboard");
    } else {
      router.replace("/assigned-tasks");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-700">Redirecting to your Task Board…</p>
      </div>
    </div>
  );
}
