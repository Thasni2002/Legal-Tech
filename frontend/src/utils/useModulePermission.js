"use client";

import { useMemo } from "react";
import { usePermissions } from "@/utils/usePermissions";

const DEFAULT_PERMS = { view: true, add: true, edit: true, delete: true };

/**
 * Resolves effective permissions for a module for the logged-in user.
 * Uses cached & deduplicated usePermissions under the hood.
 *
 * @param {string} moduleKey  e.g. "Documents", "Consultation", "Payments"
 * @returns {{ perms: {view,add,edit,delete}, loading: boolean, user: object|null }}
 */
export default function useModulePermission(moduleKey) {
  const { user, hasPermission, loading } = usePermissions();

  const perms = useMemo(() => {
    if (!moduleKey) return DEFAULT_PERMS;
    return {
      view: hasPermission(moduleKey, "view"),
      add: hasPermission(moduleKey, "add"),
      edit: hasPermission(moduleKey, "edit"),
      delete: hasPermission(moduleKey, "delete"),
    };
  }, [moduleKey, hasPermission]);

  return { perms, loading, user };
}

