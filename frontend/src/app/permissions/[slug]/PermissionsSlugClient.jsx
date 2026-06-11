"use client";

import React from "react";
import RolesView from "@/pages/UI/Permission/RolesView";
import UsersView from "@/pages/UI/Permission/UsersView";
import { notFound } from "next/navigation";

export default function PermissionsSlugClient({ slug }) {
  if (slug === "roles") {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <RolesView />
      </div>
    );
  }

  if (slug === "users") {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <UsersView />
      </div>
    );
  }

  return notFound();
}
