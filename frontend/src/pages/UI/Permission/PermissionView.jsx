"use client";

import { useState } from "react";

export default function Permission() {
  const [roles, setRoles] = useState([
    {
      id: 1,
      name: "Senior Advocate",
      description: "Full system access",
    },
    {
      id: 2,
      name: "Junior Advocate",
      description: "Limited access",
    },
    {
      id: 3,
      name: "Client",
      description: "Client access",
    },
  ]);

  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");

  const [users, setUsers] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userRole, setUserRole] = useState("");

  const modules = [
    "Dashboard",
    "Law Firm Management",
    "Client Management",
    "Case Management",
    "Consultations",
    "Calendar",
    "Finance Management",
    "Profile Management",
  ];

  const [permissions, setPermissions] = useState({});

  const addRole = () => {
    if (!roleName) return;

    setRoles([
      ...roles,
      {
        id: Date.now(),
        name: roleName,
        description: roleDescription,
      },
    ]);

    setRoleName("");
    setRoleDescription("");
  };

  const addUser = () => {
    if (!name || !email || !userRole) return;

    setUsers([
      ...users,
      {
        id: Date.now(),
        name,
        email,
        phone,
        role: userRole,
      },
    ]);

    setName("");
    setEmail("");
    setPhone("");
    setUserRole("");
  };

  const handlePermissionChange = (
    module,
    action
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]:
          !prev[module]?.[action],
      },
    }));
  };

  return (
    <div className="p-6 space-y-8 bg-slate-100 min-h-screen">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Permission Management
        </h1>

        <p className="text-gray-500">
          Roles, Users & Permissions
        </p>
      </div>

      {/* Roles Management */}
      <div className="bg-white p-6 rounded-xl border">
        <h2 className="text-2xl font-bold mb-4">
          Roles Management
        </h2>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Role Name"
            value={roleName}
            onChange={(e) =>
              setRoleName(e.target.value)
            }
            className="border p-3 rounded-lg"
          />

          <input
            type="text"
            placeholder="Description"
            value={roleDescription}
            onChange={(e) =>
              setRoleDescription(
                e.target.value
              )
            }
            className="border p-3 rounded-lg"
          />
        </div>

        <button
          onClick={addRole}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg"
        >
          Create Role
        </button>

        <table className="w-full mt-6 border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3">
                Role Name
              </th>
              <th className="border p-3">
                Description
              </th>
            </tr>
          </thead>

          <tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <td className="border p-3">
                  {role.name}
                </td>

                <td className="border p-3">
                  {role.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Users Management */}
      <div className="bg-white p-6 rounded-xl border">
        <h2 className="text-2xl font-bold mb-4">
          Users Management
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="border p-3 rounded-lg"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="border p-3 rounded-lg"
          />

          <input
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            className="border p-3 rounded-lg"
          />

          <select
            value={userRole}
            onChange={(e) =>
              setUserRole(e.target.value)
            }
            className="border p-3 rounded-lg"
          >
            <option value="">
              Select Role
            </option>

            {roles.map((role) => (
              <option
                key={role.id}
                value={role.name}
              >
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={addUser}
          className="mt-4 bg-green-600 text-white px-5 py-2 rounded-lg"
        >
          Create User
        </button>

        <table className="w-full mt-6 border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3">
                Name
              </th>
              <th className="border p-3">
                Email
              </th>
              <th className="border p-3">
                Phone
              </th>
              <th className="border p-3">
                Role
              </th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="border p-3">
                  {user.name}
                </td>

                <td className="border p-3">
                  {user.email}
                </td>

                <td className="border p-3">
                  {user.phone}
                </td>

                <td className="border p-3">
                  {user.role}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permissions */}
      <div className="bg-white p-6 rounded-xl border">
        <h2 className="text-2xl font-bold mb-4">
          Permissions
        </h2>

        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3">
                Module
              </th>

              <th className="border p-3">
                View
              </th>

              <th className="border p-3">
                Add
              </th>

              <th className="border p-3">
                Edit
              </th>

              <th className="border p-3">
                Delete
              </th>
            </tr>
          </thead>

          <tbody>
            {modules.map((module) => (
              <tr key={module}>
                <td className="border p-3">
                  {module}
                </td>

                {[
                  "view",
                  "add",
                  "edit",
                  "delete",
                ].map((action) => (
                  <td
                    key={action}
                    className="border text-center"
                  >
                    <input
                      type="checkbox"
                      checked={
                        permissions[module]?.[
                          action
                        ] || false
                      }
                      onChange={() =>
                        handlePermissionChange(
                          module,
                          action
                        )
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={() =>
            console.log(permissions)
          }
          className="mt-5 bg-purple-600 text-white px-5 py-2 rounded-lg"
        >
          Save Permissions
        </button>
      </div>
    </div>
  );
}