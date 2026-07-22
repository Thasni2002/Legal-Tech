import React from "react";
import LeaveManagementView from "@/pages/UI/LeaveManagement/LeaveManagementView";

export default function Page() {
  return (
    <div>
      <LeaveManagementView viewMode="senior" moduleKey="Leave Management" />
    </div>
  );
}
