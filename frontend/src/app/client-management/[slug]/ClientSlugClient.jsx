"use client";

import React from "react";
import Link from "next/link";
import ClientAdd from "@/pages/UI/ClientManagement/ClientAdd";
import ClientEdit from "@/pages/UI/ClientManagement/ClientEdit";
import CaseTracking from "@/pages/UI/ClientManagement/CaseTracking";


export default function ClientSlugClient({ slug }) {
  // 1. Render Client Add
  if (slug === "client-add") {
    return <ClientAdd />;
  }

  // 2. Render Client Edit
  if (slug === "edit-client") {
    return <ClientEdit />;
  }

  // 3. Render Client History
  if (slug === "view-history") {
    return <ClientHistory />;
  }

  // 4. Render Case Tracking
  if (slug === "case-tracking") {
    return <CaseTracking />;
  }

  // Default fallback if unknown slug
  return (
    <div className="p-6 text-center">
      <h1 className="text-xl font-bold">Unknown Action</h1>
      <Link href="/client-management" className="text-blue-600 underline">
        Back to Client Management
      </Link>
    </div>
  );
}
