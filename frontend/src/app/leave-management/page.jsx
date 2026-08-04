"use client";

import React, { Suspense } from "react";
import LeaveManagementView from "@/views/UI/LeaveManagement/LeaveManagementView";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500 font-bold">Loading Leave Management...</div>}>
      <LeaveManagementView viewMode="senior" moduleKey="Leave Management" />
    </Suspense>
  );
}
