import { useState, useEffect } from "react";
import { getLoggedInUser } from "./auth";
import { API_BASE_URL } from "./api";

// Global in-memory cache & promise deduplication for permissions
let permissionsCache = {
  matrix: null,
  userPermissions: {},
  matrixPromise: null,
  userPromises: {},
  lastFetched: 0,
};

export const clearPermissionsCache = () => {
  permissionsCache = {
    matrix: null,
    userPermissions: {},
    matrixPromise: null,
    userPromises: {},
    lastFetched: 0,
  };
};

const fetchMatrixDeduplicated = async () => {
  if (permissionsCache.matrix && Date.now() - permissionsCache.lastFetched < 60000) {
    return permissionsCache.matrix;
  }
  if (!permissionsCache.matrixPromise) {
    permissionsCache.matrixPromise = fetch(`${API_BASE_URL}/permissions`)
      .then((res) => (res.status === 200 ? res.json() : {}))
      .then((data) => {
        permissionsCache.matrix = data;
        permissionsCache.lastFetched = Date.now();
        return data;
      })
      .catch(() => ({}))
      .finally(() => {
        permissionsCache.matrixPromise = null;
      });
  }
  return permissionsCache.matrixPromise;
};

const fetchUserPermsDeduplicated = async (userId) => {
  if (permissionsCache.userPermissions[userId] && Date.now() - permissionsCache.lastFetched < 60000) {
    return permissionsCache.userPermissions[userId];
  }
  if (!permissionsCache.userPromises[userId]) {
    permissionsCache.userPromises[userId] = fetch(`${API_BASE_URL}/permissions/users/${userId}`)
      .then((res) => (res.status === 200 ? res.json() : { customPermissions: {} }))
      .then((data) => {
        permissionsCache.userPermissions[userId] = data;
        return data;
      })
      .catch(() => ({ customPermissions: {} }))
      .finally(() => {
        delete permissionsCache.userPromises[userId];
      });
  }
  return permissionsCache.userPromises[userId];
};

export function usePermissions() {
  const [user, setUser] = useState(null);
  const [customPermissions, setCustomPermissions] = useState({});
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(true);

  const loadPermissions = (force = false) => {
    const loggedIn = getLoggedInUser();
    setUser(loggedIn);

    if (force) {
      clearPermissionsCache();
    }

    if (loggedIn && loggedIn.id) {
      Promise.all([
        fetchUserPermsDeduplicated(loggedIn.id),
        fetchMatrixDeduplicated(),
      ])
        .then(([userData, matrix]) => {
          setCustomPermissions(userData?.customPermissions || {});
          
          if (matrix && loggedIn.role) {
            const roleNorm = loggedIn.role.toLowerCase().replace(/\s+/g, "");
            const roleKey = Object.keys(matrix).find(
              (k) => k.toLowerCase().replace(/\s+/g, "") === roleNorm
            );
            if (roleKey) {
              setRolePermissions(matrix[roleKey] || {});
            } else {
              setRolePermissions(matrix[loggedIn.role] || {});
            }
          }
        })
        .catch((err) => {
          console.warn("Permissions hook network fallback active:", err?.message || err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
    const handleUpdate = () => loadPermissions(true);
    window.addEventListener("permissions_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("permissions_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const hasPermission = (moduleKey, action) => {
    if (!moduleKey) return true;

    // 1. Check custom permissions (direct overrides) first
    if (customPermissions && customPermissions[moduleKey] !== undefined) {
      if (customPermissions[moduleKey][action] !== undefined) {
        return !!customPermissions[moduleKey][action];
      }
    }

    // 2. Check role-wide permissions next
    if (rolePermissions && rolePermissions[moduleKey] !== undefined) {
      return !!rolePermissions[moduleKey][action];
    }

    return true; // fallback — allow access by default if no explicit restriction rule is matched
  };

  return { user, hasPermission, loading, customPermissions, rolePermissions };
}

