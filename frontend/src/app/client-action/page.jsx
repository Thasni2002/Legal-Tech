"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ClientActionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const paramsStr = searchParams.toString();
    router.replace(`/consultation-action${paramsStr ? `?${paramsStr}` : ""}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <p className="text-sm font-semibold text-slate-300">Redirecting to action portal...</p>
    </div>
  );
}

export default function ClientActionRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-sm font-semibold">Redirecting...</p>
      </div>
    }>
      <ClientActionContent />
    </Suspense>
  );
}
