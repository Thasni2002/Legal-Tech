"use client";

import { useState, useEffect } from "react";
import { getLoggedInUser } from "@/utils/auth";
import { API_BASE_URL } from "@/utils/api";

const DEFAULT_PERMS = { view: true, add: true, edit: true, delete: true };

/**
 * Resolves effective permissions for a module for the logged-in user.
 * Priority:
 *   1. User's customPermissions[moduleKey]  (from /permissions/users/:id)
 *   2. Role defaults[role][moduleKey]        (from /permissions)
 *   3. All allowed (no config = no restriction)
 *
 * @param {string} moduleKey  e.g. "Documents", "Consultation", "Payments"
 * @returns {{ perms: {view,add,edit,delete}, loading: boolean, user: object|null }}
 */
export default function useModulePermission(moduleKey) {
  const [perms, setPerms] = useState(DEFAULT_PERMS);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!moduleKey) {
      setLoading(false);
      return;
    }

    const resolve = async () => {
      const loggedIn = getLoggedInUser();
      setUser(loggedIn);

      if (!loggedIn) {
        setLoading(false);
        return;
      }

      // 1. Fetch role defaults first
      let roleDefaults = {};
      try {
        const resRole = await fetch(`${API_BASE_URL}/permissions`);
        if (resRole.ok) {
          const allPerms = await resRole.json();
          roleDefaults = (allPerms[loggedIn.role] || {})[moduleKey] || {};
        }
      } catch (_) {}

      // 2. Fetch user's custom overrides
      let customOverrides = {};
      try {
        const resUser = await fetch(`${API_BASE_URL}/permissions/users/${loggedIn.id}`);
        if (resUser.ok) {
          const data = await resUser.json();
          const custom = data.customPermissions || {};
          customOverrides = custom[moduleKey] || {};
          setUser({ ...loggedIn, ...data });
        }
      } catch (_) {}

      // 3. Merge: DEFAULT_PERMS (all true) <- roleDefaults <- customOverrides
      // Wait, if no config exists, we allow everything (DEFAULT_PERMS).
      // But if roleDefaults OR customOverrides exist for this module, we assume explicit configuration.
      // Usually, if a module is defined in the role matrix, it has {view, add, edit, delete} explicitly set.
      
      const hasRoleConfig = Object.keys(roleDefaults).length > 0;
      const hasCustomConfig = Object.keys(customOverrides).length > 0;

      if (hasRoleConfig || hasCustomConfig) {
        // Start with all false if there's any explicit config, then layer role, then layer custom
        const base = { view: false, add: false, edit: false, delete: false };
        setPerms({ ...base, ...roleDefaults, ...customOverrides });
      } else {
        // Fallback to allow all
        setPerms(DEFAULT_PERMS);
      }
      
      setLoading(false);

    };

    resolve();
  }, [moduleKey]);

  return { perms, loading, user };
}
