"use client";

import React from "react";
import RolesView from "@/pages/UI/Permission/RolesView";
import UsersView from "@/pages/UI/Permission/UsersView";
import { notFound } from "next/navigation";

export default function PermissionsSlugClient({ slug }) {
  if (slug === "roles") {
    return <RolesView />;
  }

  if (slug === "users") {
    return <UsersView />;
  }

  return notFound();
}
