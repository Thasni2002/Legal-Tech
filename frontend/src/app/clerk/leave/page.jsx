import React from "react";
import LeaveManagementView from "@/pages/UI/LeaveManagement/LeaveManagementView";

export default function Page() {
  return (
    <div>
      <LeaveManagementView viewMode="clerk" moduleKey="Clerk Leave" />
    </div>
  );
}
