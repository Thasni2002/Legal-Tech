import { useState, useEffect } from "react";
import { getLoggedInUser } from "./auth";

export function usePermissions() {
  const [user, setUser] = useState(null);
  const [customPermissions, setCustomPermissions] = useState({});
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedIn = getLoggedInUser();
    Promise.resolve().then(() => {
      setUser(loggedIn);
    });

    if (loggedIn && loggedIn.id) {
      Promise.all([
        fetch(`http://localhost:8000/permissions/users/${loggedIn.id}`).then((res) => {
          return res.status === 200 ? res.json() : { customPermissions: {} };
        }),
        fetch("http://localhost:8000/permissions").then((res) => {
          return res.status === 200 ? res.json() : {};
        })
      ])
        .then(([userData, matrix]) => {
          setCustomPermissions(userData.customPermissions || {});
          
          const roleKey = Object.keys(matrix).find(
            (k) => k.toLowerCase().replace(/\s+/g, "") === loggedIn.role.toLowerCase().replace(/\s+/g, "")
          );
          if (roleKey) {
            setRolePermissions(matrix[roleKey] || {});
          } else {
            setRolePermissions(matrix[loggedIn.role] || {});
          }
        })
        .catch((err) => {
          console.error("Error loading permissions hook:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      Promise.resolve().then(() => {
        setLoading(false);
      });
    }
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

    return true; // fallback
  };

  return { user, hasPermission, loading };
}
