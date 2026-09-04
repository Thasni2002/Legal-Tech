"use client";

import { apiClient, updateUser } from "@/services/apiServices";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const ACTIONS = ["view", "add", "edit", "delete"];

const ALL_MODULES = [
  "Dashboard",
  "Junior Dashboard",
  "Client Dashboard",
  "Law Firm Management",
  "Client Management",
  "Case Management",
  "Consultations",
  "Finance Management",
  "Calendar",
  "Junior Calendar",
  "Profile",
  "Assigned Cases",
  "Assigned Tasks",
  "Junior Assigned Tasks",
  "Clerk Assigned Tasks",
  "Client Section",
  "Consultation",
  "Case Tracking",
  "Documents",
  "Payments",
  "User Roles",
  "Roles",
  "Users",
  "Permissions",
  "Clerk Dashboard",
  "Court Visit",
  "Format Physical File",
  "Clerk Documents",
  "Clerk Cases",
  "Leave Management",
  "Junior Leave",
  "Clerk Leave",
  "eCourts Integration",
];

export default function UserEdit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");

  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await apiClient(`/permissions/users/${userId}`);
        setUser(data);
      } catch (e) {
        console.error("Error loading user", e);
      }
    };

    if (userId) loadUser();
  }, [userId]);

  const handlePermissionToggle = (module, action) => {
    setUser((prev) => ({
      ...prev,
      customPermissions: {
        ...prev.customPermissions,
        [module]: {
          ...prev.customPermissions?.[module],
          [action]:
            !prev.customPermissions?.[module]?.[action],
        },
      },
    }));
  };

  const handleSave = async () => {
    try {
      await updateUser(user.id, user);
      router.push("/UI/Permission/UserView");
    } catch (e) {
      console.error("Error updating user permissions", e);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="w-full space-y-8">
      <div className="bg-white rounded-3xl p-8 border shadow-sm">
        <h1 className="text-2xl font-bold mb-6">Edit User</h1>

        <div className="grid grid-cols-2 gap-4">
          <input
            value={user.firstName || ""}
            onChange={(e) =>
              setUser({ ...user, firstName: e.target.value })
            }
            className="border rounded-xl p-3"
          />

          <input
            value={user.lastName || ""}
            onChange={(e) =>
              setUser({ ...user, lastName: e.target.value })
            }
            className="border rounded-xl p-3"
          />

          <input
            value={user.email || ""}
            onChange={(e) =>
              setUser({ ...user, email: e.target.value })
            }
            className="border rounded-xl p-3"
          />

          <input
            value={user.phone || ""}
            onChange={(e) =>
              setUser({ ...user, phone: e.target.value })
            }
            className="border rounded-xl p-3"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border shadow-sm p-8">
        <h2 className="text-xl font-bold mb-4">Direct Permissions</h2>

        <div className="overflow-auto max-h-[70vh] rounded-2xl border border-slate-200">
          <table className="w-full">
            <thead className="sticky top-0 z-20 bg-slate-50 shadow-xs">
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="sticky top-0 bg-slate-50 z-20 py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-left">Module Name</th>
                {ACTIONS.map((act) => (
                  <th key={act} className="sticky top-0 bg-slate-50 z-20 py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">{act}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {ALL_MODULES.map((module) => (
                <tr key={module} className="border-t">
                  <td className="p-4">{module}</td>

                  {ACTIONS.map((action) => (
                    <td key={action} className="text-center">
                      <input
                        type="checkbox"
                        checked={
                          user.customPermissions?.[module]?.[action] || false
                        }
                        onChange={() =>
                          handlePermissionToggle(module, action)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-slate-100 rounded-xl"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-3 bg-black text-white rounded-xl"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
