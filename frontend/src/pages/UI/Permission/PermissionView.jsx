"use client";

import React, { useState, useEffect } from "react";
import { Shield, ShieldAlert, CheckSquare, Save, Users, AlertTriangle, HelpCircle, UserCheck } from "lucide-react";

const DEFAULT_ROLES = [
  { id: "senioradvocate", name: "Senior Advocate", description: "Full system access" },
  { id: "junioradvocate", name: "Junior Advocate", description: "Limited access" },
  { id: "client", name: "Client", description: "Client access" }
];

const DEFAULT_USERS = [
  {
    id: "user_1",
    firstName: "Rahul",
    lastName: "Sharma",
    phone: "+91 98765 43210",
    username: "rahulsharma",
    email: "rahul@legaltech.com",
    role: "Senior Advocate",
    tempPassword: "temp_Rahul123!",
    customPermissions: {},
    documentAccess: []
  },
  {
    id: "user_2",
    firstName: "Priya",
    lastName: "Nair",
    phone: "+91 87654 32109",
    username: "priyanair",
    email: "priya@legaltech.com",
    role: "Junior Advocate",
    tempPassword: "temp_Priya456!",
    customPermissions: {},
    documentAccess: []
  },
  {
    id: "user_3",
    firstName: "Amit",
    lastName: "Verma",
    phone: "+91 76543 21098",
    username: "amitverma",
    email: "amit@legaltech.com",
    role: "Client",
    tempPassword: "temp_Amit789!",
    customPermissions: {},
    documentAccess: []
  }
];

const ACTIONS = ["view", "add", "edit", "delete"];

// All modules (internal keys stay consistent for localStorage storage)
const BASE_MODULES = [
  "Dashboard",
  "Law Firm Management",
  "Client Management",
  "Case Management",
  "Consultations",
  "Calendar",
  "Finance Management",
  "Profile Management",
];

// Role-specific display label overrides for module names
const ROLE_MODULE_LABELS = {
  "Senior Advocate": { "Dashboard": "Adv Dashboard" },
  "Junior Advocate": { "Dashboard": "User Dashboard" },
  "Client":          { "Dashboard": "Client Dashboard" },
};

// Returns modules with display labels resolved for a given role name
const getModulesForRole = (roleName, isDirectPermission = false) => {
  let resolvedRoleName = roleName;
  if (isDirectPermission) {
    if (roleName === "Senior Advocate") {
      resolvedRoleName = "Junior Advocate";
    } else if (roleName === "Junior Advocate") {
      resolvedRoleName = "Client";
    }
  }
  const overrides = ROLE_MODULE_LABELS[resolvedRoleName] || {};
  return BASE_MODULES.map((mod) => ({
    key: mod,                                    // internal storage key
    label: overrides[mod] || mod,               // display label
  }));
};

// Pre-configured default permission matrices for standard roles
const DEFAULT_PERMISSIONS = {
  "Senior Advocate": {
    "Dashboard": { view: true, add: true, edit: true, delete: true },
    "Law Firm Management": { view: true, add: true, edit: true, delete: true },
    "Client Management": { view: true, add: true, edit: true, delete: true },
    "Case Management": { view: true, add: true, edit: true, delete: true },
    "Consultations": { view: true, add: true, edit: true, delete: true },
    "Calendar": { view: true, add: true, edit: true, delete: true },
    "Finance Management": { view: true, add: true, edit: true, delete: true },
    "Profile Management": { view: true, add: true, edit: true, delete: true },
  },
  "Junior Advocate": {
    "Dashboard": { view: true, add: false, edit: false, delete: false },
    "Law Firm Management": { view: true, add: false, edit: false, delete: false },
    "Client Management": { view: true, add: true, edit: true, delete: false },
    "Case Management": { view: true, add: true, edit: true, delete: false },
    "Consultations": { view: true, add: true, edit: false, delete: false },
    "Calendar": { view: true, add: true, edit: true, delete: false },
    "Finance Management": { view: false, add: false, edit: false, delete: false },
    "Profile Management": { view: true, add: false, edit: true, delete: false },
  },
  "Client": {
    "Dashboard": { view: true, add: false, edit: false, delete: false },
    "Law Firm Management": { view: false, add: false, edit: false, delete: false },
    "Client Management": { view: false, add: false, edit: false, delete: false },
    "Case Management": { view: true, add: false, edit: false, delete: false },
    "Consultations": { view: true, add: true, edit: false, delete: false },
    "Calendar": { view: true, add: false, edit: false, delete: false },
    "Finance Management": { view: true, add: false, edit: false, delete: false },
    "Profile Management": { view: true, add: false, edit: true, delete: false },
  }
};

export default function PermissionView() {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedUser, setSelectedUser] = useState(""); // username of selected user for override
  const [permissions, setPermissions] = useState({});
  const [notification, setNotification] = useState(null);

  // Load configuration on mount
  useEffect(() => {
    // 1. Roles
    const storedRoles = localStorage.getItem("legal_tech_roles");
    let currentRoles = DEFAULT_ROLES;
    if (storedRoles) {
      try {
        const parsed = JSON.parse(storedRoles);
        const hasOldRole = parsed.some(
          (r) => r.id === "superadmin" || r.id === "teacher" || r.name === "SuperAdmin"
        );
        if (hasOldRole) {
          currentRoles = DEFAULT_ROLES;
          localStorage.setItem("legal_tech_roles", JSON.stringify(DEFAULT_ROLES));
        } else {
          currentRoles = parsed;
        }
      } catch (e) {
        currentRoles = DEFAULT_ROLES;
      }
    } else {
      localStorage.setItem("legal_tech_roles", JSON.stringify(DEFAULT_ROLES));
    }
    setRoles(currentRoles);

    // Pick first role as active default
    if (currentRoles.length > 0) {
      setSelectedRole(currentRoles[0].name);
    }

    // 2. Users (to count assigned users per role and edit custom user override)
    const storedUsers = localStorage.getItem("legal_tech_users");
    if (storedUsers) {
      try {
        const parsed = JSON.parse(storedUsers);
        const hasOldUserRole = parsed.some(
          (u) => u.role === "SuperAdmin" || u.role === "teacher"
        );
        if (hasOldUserRole) {
          localStorage.setItem("legal_tech_users", JSON.stringify(DEFAULT_USERS));
          setUsers(DEFAULT_USERS);
        } else {
          setUsers(parsed);
        }
      } catch (e) {
        localStorage.setItem("legal_tech_users", JSON.stringify(DEFAULT_USERS));
        setUsers(DEFAULT_USERS);
      }
    } else {
      localStorage.setItem("legal_tech_users", JSON.stringify(DEFAULT_USERS));
      setUsers(DEFAULT_USERS);
    }

    // 3. Permissions
    const storedPermissions = localStorage.getItem("legal_tech_permissions");
    if (storedPermissions) {
      try {
        const parsed = JSON.parse(storedPermissions);
        if (parsed["SuperAdmin"] || parsed["teacher"]) {
          setPermissions(DEFAULT_PERMISSIONS);
          localStorage.setItem("legal_tech_permissions", JSON.stringify(DEFAULT_PERMISSIONS));
        } else {
          setPermissions(parsed);
        }
      } catch (e) {
        setPermissions(DEFAULT_PERMISSIONS);
        localStorage.setItem("legal_tech_permissions", JSON.stringify(DEFAULT_PERMISSIONS));
      }
    } else {
      setPermissions(DEFAULT_PERMISSIONS);
      localStorage.setItem("legal_tech_permissions", JSON.stringify(DEFAULT_PERMISSIONS));
    }
  }, []);

  // Reset selected user override when the active selected role changes
  useEffect(() => {
    setSelectedUser("");
  }, [selectedRole]);

  // Show toast utility
  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Get active matrix for currently selected configuration (either user override or role default)
  const getActivePermissionsMatrix = () => {
    if (!selectedRole) return {};

    // Direct User Override selected
    if (selectedUser) {
      const targetUser = users.find((u) => u.username === selectedUser);
      if (targetUser && targetUser.customPermissions && Object.keys(targetUser.customPermissions).length > 0) {
        return targetUser.customPermissions;
      }
      // Fallback: If user has no custom permissions configured yet, return role defaults as a starting point
      return permissions[selectedRole] || {};
    }

    // Configure role-wide matrix
    return permissions[selectedRole] || {};
  };

  // Checkbox toggling handler
  const handlePermissionToggle = (module, action) => {
    if (!selectedRole) return;

    if (selectedUser) {
      // Direct User Override toggle
      const updatedUsers = users.map((u) => {
        if (u.username === selectedUser) {
          // Fallback to role defaults if customPermissions are empty
          const currentCustom = u.customPermissions && Object.keys(u.customPermissions).length > 0
            ? u.customPermissions
            : JSON.parse(JSON.stringify(permissions[selectedRole] || {}));

          const modulePermissions = currentCustom[module] || {
            view: false,
            add: false,
            edit: false,
            delete: false,
          };

          return {
            ...u,
            customPermissions: {
              ...currentCustom,
              [module]: {
                ...modulePermissions,
                [action]: !modulePermissions[action],
              },
            },
          };
        }
        return u;
      });
      setUsers(updatedUsers);
    } else {
      // Role-wide toggle
      setPermissions((prev) => {
        const rolePermissions = prev[selectedRole] || {};
        const modulePermissions = rolePermissions[module] || {
          view: false,
          add: false,
          edit: false,
          delete: false,
        };

        const updated = {
          ...prev,
          [selectedRole]: {
            ...rolePermissions,
            [module]: {
              ...modulePermissions,
              [action]: !modulePermissions[action],
            },
          },
        };

        return updated;
      });
    }
  };

  // Toggle ALL actions for a module
  const handleToggleModuleAll = (module) => {
    if (!selectedRole) return;

    const activeMatrix = getActivePermissionsMatrix();
    const modulePermissions = activeMatrix[module] || {
      view: false,
      add: false,
      edit: false,
      delete: false,
    };

    const anyFalse = ACTIONS.some(act => !modulePermissions[act]);
    const targetValue = anyFalse;

    if (selectedUser) {
      // User Override
      const updatedUsers = users.map((u) => {
        if (u.username === selectedUser) {
          const currentCustom = u.customPermissions && Object.keys(u.customPermissions).length > 0
            ? u.customPermissions
            : JSON.parse(JSON.stringify(permissions[selectedRole] || {}));

          return {
            ...u,
            customPermissions: {
              ...currentCustom,
              [module]: {
                view: targetValue,
                add: targetValue,
                edit: targetValue,
                delete: targetValue,
              }
            }
          };
        }
        return u;
      });
      setUsers(updatedUsers);
    } else {
      // Role-wide
      const rolePermissions = permissions[selectedRole] || {};
      setPermissions((prev) => ({
        ...prev,
        [selectedRole]: {
          ...rolePermissions,
          [module]: {
            view: targetValue,
            add: targetValue,
            edit: targetValue,
            delete: targetValue,
          }
        }
      }));
    }
  };

  // Save current states back to localStorage
  const handleSavePermissions = () => {
    if (!selectedRole) return;

    if (selectedUser) {
      // Save User Override
      localStorage.setItem("legal_tech_users", JSON.stringify(users));
      showToast(`Direct permissions for user "${selectedUser}" saved successfully!`);
    } else {
      // Save Role defaults
      localStorage.setItem("legal_tech_permissions", JSON.stringify(permissions));
      showToast(`Default permissions for "${selectedRole}" saved successfully!`);
    }
  };

  // Count active users for a specific role name
  const getUserCountForRole = (roleName) => {
    return users.filter((u) => u.role.toLowerCase() === roleName.toLowerCase()).length;
  };

  // Get users belonging to the active role
  const getRoleSpecificUsers = () => {
    return users.filter((u) => u.role.toLowerCase() === selectedRole.toLowerCase());
  };

  const activeMatrix = getActivePermissionsMatrix();
  const roleUsers = getRoleSpecificUsers();
  const selectedUserObj = users.find(u => u.username === selectedUser);

  // Resolve which role's module labels to use:
  // - In direct override mode, use the overridden user's own role
  // - Otherwise use the selected role card
  const effectiveRoleForModules = selectedUser && selectedUserObj
    ? selectedUserObj.role
    : selectedRole;
  const activeModules = getModulesForRole(effectiveRoleForModules, !!selectedUser);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl transition-all duration-300 border animate-bounce ${
            notification.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {notification.type === "error" ? (
            <AlertTriangle size={20} className="text-red-500" />
          ) : (
            <CheckSquare size={20} className="text-emerald-600" />
          )}
          <span className="font-semibold text-sm">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-[#0f172a] uppercase tracking-wider">
          Permissions Management
        </h1>
        <p className="text-sm font-semibold text-slate-400 tracking-wider">
          ASSIGN DETAILED MODULE ACCESS RULES AND SECURITY LEVEL CLEARANCES PER USER ROLE OR SPECIFIC USERS.
        </p>
      </div>

      {/* Interactive Role Card Selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Select Role to Configure
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {roles.map((role) => {
            const active = selectedRole === role.name;
            const userCount = getUserCountForRole(role.name);

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.name)}
                className={`flex flex-col text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  active
                    ? "border-emerald-600 bg-emerald-50/25 ring-2 ring-emerald-600/10 shadow-sm"
                    : "border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      active ? "bg-[#0d6e53] text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Shield size={16} />
                  </div>
                  <span
                    className={`text-xxs font-bold px-2 py-0.5 rounded-full ${
                      userCount > 0
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {userCount} {userCount === 1 ? "user" : "users"}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 mt-4 text-sm truncate w-full">
                  {role.name}
                </h3>
                <p className="text-slate-400 text-xxs mt-1 font-semibold truncate w-full">
                  {role.description || "No description provided"}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Permissions Matrix Panel */}
      {selectedRole ? (
        <div className="space-y-6">
          {/* User selector override dropdown */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-sm">Configure Direct User Override (Optional)</h3>
              <p className="text-xxs text-slate-400 font-semibold uppercase tracking-wider">
                Select a specific user holding the "{selectedRole}" role to edit their individual direct permissions.
              </p>
            </div>
            
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 focus:bg-white focus:ring-4 focus:ring-emerald-50 outline-none w-full md:w-72"
            >
              <option value="">Config Role Defaults (None Selected)</option>
              {roleUsers.map(user => (
                <option key={user.id} value={user.username}>
                  {user.firstName} {user.lastName} ({user.username})
                </option>
              ))}
            </select>
          </div>

          {/* Override Warning Banner */}
          {selectedUser && selectedUserObj && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-blue-800 flex items-start gap-3.5">
              <UserCheck size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs font-semibold">
                <p className="font-bold uppercase tracking-wider">Direct User Override Mode Active</p>
                <p className="mt-1 text-blue-700/90 font-medium normal-case">
                  You are editing direct override permissions for user <strong className="font-bold text-blue-900">{selectedUserObj.firstName} {selectedUserObj.lastName} ({selectedUserObj.username})</strong>.
                  These changes will affect only this specific user account and override standard defaults for the <strong className="font-bold text-blue-900">{selectedRole}</strong> role.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            {/* Title and Save button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert size={20} className="text-[#0d6e53]" />
                  <span>
                    {selectedUser 
                      ? `Override Permissions: ${selectedUserObj ? `${selectedUserObj.firstName} ${selectedUserObj.lastName}` : selectedUser}` 
                      : `Default Permissions: ${selectedRole}`
                    }
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure specific module rights and clearance levels. Click "Save Permissions" to commit changes.
                </p>
              </div>

              <button
                onClick={handleSavePermissions}
                className="bg-black hover:bg-slate-800 text-white text-xs font-bold uppercase py-3.5 px-7 rounded-full cursor-pointer tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                <Save size={16} />
                <span>Save Permissions</span>
              </button>
            </div>

            {/* Table Matrix */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-4.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Module Name
                    </th>
                    {ACTIONS.map((action) => (
                      <th
                        key={action}
                        className="py-4.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-32"
                      >
                        {action}
                      </th>
                    ))}
                    <th className="py-4.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-24">
                      All
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeModules.map(({ key, label }) => {
                    const moduleMatrix = activeMatrix[key] || {
                      view: false,
                      add: false,
                      edit: false,
                      delete: false,
                    };
                    const allSelected = ACTIONS.every(act => moduleMatrix[act]);

                    return (
                      <tr
                        key={key}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4.5 px-6 font-bold text-slate-800 text-sm">
                          {label}
                        </td>

                        {ACTIONS.map((action) => (
                          <td key={action} className="py-4.5 px-6 text-center">
                            <label className="inline-flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors group">
                              <input
                                type="checkbox"
                                checked={moduleMatrix[action] || false}
                                onChange={() => handlePermissionToggle(key, action)}
                                className="w-4.5 h-4.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 focus:ring-2 accent-[#0d6e53] cursor-pointer"
                              />
                            </label>
                          </td>
                        ))}

                        {/* Toggle All */}
                        <td className="py-4.5 px-6 text-center bg-slate-50/20">
                          <button
                            type="button"
                            onClick={() => handleToggleModuleAll(key)}
                            className={`text-xxs font-bold px-2 py-1 rounded transition-all cursor-pointer ${
                              allSelected
                                ? "bg-emerald-50 text-[#0d6e53] hover:bg-emerald-100 border border-emerald-200"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200"
                            }`}
                          >
                            {allSelected ? "DESELECT" : "SELECT ALL"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
          <HelpCircle size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-700 text-base">Select a user role</h3>
          <p className="text-slate-400 text-xs mt-1">
            Please click on any of the role cards above to configure permissions.
          </p>
        </div>
      )}
    </div>
  );
}