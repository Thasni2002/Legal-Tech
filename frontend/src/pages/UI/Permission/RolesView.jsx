"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, Shield, Info, AlertTriangle } from "lucide-react";

const DEFAULT_ROLES = [
  { id: "senioradvocate", name: "Senior Advocate", description: "Full system access" },
  { id: "junioradvocate", name: "Junior Advocate", description: "Limited access" },
  { id: "client", name: "Client", description: "Client access" }
];

export default function RolesView() {
  const [roles, setRoles] = useState([]);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRole, setEditingRole] = useState(null);
  const [notification, setNotification] = useState(null);

  // Load roles from localStorage on mount
  useEffect(() => {
    const storedRoles = localStorage.getItem("legal_tech_roles");
    if (storedRoles) {
      try {
        const parsed = JSON.parse(storedRoles);
        const hasOldRole = parsed.some(
          (r) => r.id === "superadmin" || r.id === "teacher" || r.name === "SuperAdmin"
        );
        if (hasOldRole) {
          setRoles(DEFAULT_ROLES);
          localStorage.setItem("legal_tech_roles", JSON.stringify(DEFAULT_ROLES));
        } else {
          setRoles(parsed);
        }
      } catch (e) {
        setRoles(DEFAULT_ROLES);
        localStorage.setItem("legal_tech_roles", JSON.stringify(DEFAULT_ROLES));
      }
    } else {
      setRoles(DEFAULT_ROLES);
      localStorage.setItem("legal_tech_roles", JSON.stringify(DEFAULT_ROLES));
    }
  }, []);

  // Show notification toast helper
  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Create or update role
  const handleSaveRole = (e) => {
    e.preventDefault();
    if (!roleName.trim()) {
      showToast("Role name is required", "error");
      return;
    }

    let updatedRoles;

    if (editingRole) {
      // Editing Mode
      if (editingRole.id === "senioradvocate" && roleName.toLowerCase() !== "senior advocate") {
        showToast("Cannot rename Senior Advocate role to protect system integrity.", "error");
        return;
      }

      updatedRoles = roles.map((r) =>
        r.id === editingRole.id
          ? { ...r, name: roleName.trim(), description: roleDescription.trim() }
          : r
      );
      showToast(`Role "${roleName}" updated successfully!`);
      setEditingRole(null);
    } else {
      // Creating Mode
      const roleExists = roles.some(
        (r) => r.name.toLowerCase() === roleName.trim().toLowerCase()
      );
      if (roleExists) {
        showToast(`Role "${roleName}" already exists!`, "error");
        return;
      }

      const newRole = {
        id: "role_" + Date.now(),
        name: roleName.trim(),
        description: roleDescription.trim(),
      };
      updatedRoles = [...roles, newRole];
      showToast(`Role "${roleName}" created successfully!`);
    }

    setRoles(updatedRoles);
    localStorage.setItem("legal_tech_roles", JSON.stringify(updatedRoles));
    setRoleName("");
    setRoleDescription("");
  };

  // Set role up for editing
  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete a role
  const handleDeleteRole = (roleId, roleName) => {
    if (
      roleId === "senioradvocate" ||
      roleId === "junioradvocate" ||
      roleId === "client" ||
      roleName === "Senior Advocate" ||
      roleName === "Junior Advocate" ||
      roleName === "Client"
    ) {
      showToast(`Cannot delete core role "${roleName}"`, "error");
      return;
    }

    if (confirm(`Are you sure you want to delete the "${roleName}" role?`)) {
      const updatedRoles = roles.filter((r) => r.id !== roleId);
      setRoles(updatedRoles);
      localStorage.setItem("legal_tech_roles", JSON.stringify(updatedRoles));
      showToast(`Role "${roleName}" deleted.`);

      // Clear edit state if we just deleted the role being edited
      if (editingRole && editingRole.id === roleId) {
        setEditingRole(null);
        setRoleName("");
        setRoleDescription("");
      }
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
  };

  // Filter roles based on search query
  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 md:space-y-8">
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
            <Shield size={20} className="text-emerald-600" />
          )}
          <span className="font-semibold text-sm">{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
          Roles Management
        </h1>
        <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
          Create, edit, and delete user roles. Assign permissions separately.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create / Edit Form */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm h-fit">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {editingRole ? "Edit Role" : "Create New Role"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {editingRole ? "Modify role settings" : "Add a custom role to the system"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveRole} className="space-y-6">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Role Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Manager, Editor"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Description (Optional)
              </label>
              <textarea
                placeholder="Short description of this role"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-black text-white hover:bg-slate-800 text-xs font-bold uppercase py-3.5 px-6 rounded-full cursor-pointer tracking-wider transition-all shadow-md active:scale-95"
              >
                {editingRole ? "Save Changes" : "Create Role"}
              </button>

              {editingRole && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold uppercase py-3.5 px-6 rounded-full cursor-pointer tracking-wider transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Existing Roles list */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              Existing Roles
            </h2>

            {/* Search */}
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-slate-50/50 pl-11 pr-5 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-[#2563EB] outline-none transition-all"
              />
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider w-12">
                    {/* Placeholder Select Header Icon */}
                    <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Role Name
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRoles.length > 0 ? (
                  filteredRoles.map((role) => (
                    <tr
                      key={role.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4.5 px-6">
                        <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0"></div>
                      </td>
                      <td className="py-4.5 px-6 font-bold text-slate-800 text-sm">
                        {role.name}
                      </td>
                      <td className="py-4.5 px-6 text-slate-500 text-xs font-medium">
                        {role.description || (
                          <span className="text-slate-300 italic">No description provided</span>
                        )}
                      </td>
                      <td className="py-4.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-3.5">
                          <button
                            onClick={() => handleEditRole(role)}
                            className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            title="Edit Role"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id, role.name)}
                            className={`p-1 transition-colors cursor-pointer ${
                              role.id === "senioradvocate" ||
                              role.id === "junioradvocate" ||
                              role.id === "client" ||
                              role.name === "Senior Advocate" ||
                              role.name === "Junior Advocate" ||
                              role.name === "Client"
                                ? "text-slate-200 cursor-not-allowed"
                                : "text-slate-400 hover:text-red-600"
                            }`}
                            disabled={
                              role.id === "senioradvocate" ||
                              role.id === "junioradvocate" ||
                              role.id === "client" ||
                              role.name === "Senior Advocate" ||
                              role.name === "Junior Advocate" ||
                              role.name === "Client"
                            }
                            title="Delete Role"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Info size={24} className="text-slate-300" />
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                          No roles found
                        </span>
                        <span className="text-slate-300 text-xxs font-semibold">
                          Try searching for something else or create a new role.
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
