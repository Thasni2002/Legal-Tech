"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  UserPlus, Key, Eye, EyeOff, RefreshCw, AlertTriangle, 
  ShieldCheck, Mail, Phone, User, Check, X, FileText, Settings, Shield
} from "lucide-react";

const DEFAULT_ROLES = [
  { id: "senioradvocate", name: "Senior Advocate", description: "Full system access" },
  { id: "junioradvocate", name: "Junior Advocate", description: "Limited access" },
  { id: "client", name: "Client", description: "Client access" }
];



const ACTIONS = ["view", "add", "edit", "delete"];

// Base module keys (internal, used for localStorage storage)
const ALL_MODULES = [
  // Advocate Section
  "Dashboard",
  "Law Firm Management",
  "Client Management",
  "Case Management",
  "Consultations",
  "Finance Management",
  "Calendar",
  "Profile",

  // Junior Advocate
  "Assigned Cases",
  "Client Section",

  // Client Section
  "Consultation",
  "Case Tracking",
  "Documents",
  "Payments",

  // System
  "User Roles",
  "Roles",
  "Users",
  "Permissions",
];

const getModulesForRole = () => {
  return ALL_MODULES.map((mod) => ({
    key: mod,
    label: mod,
  }));
};



const DEFAULT_DOCUMENTS = [
  { docId: "doc_1", name: "Smith v. State - Case Brief.pdf", type: "Case File", view: true, upload: true, edit: false, delete: false },
  { docId: "doc_2", name: "Land Title Deed - John Doe.pdf", type: "Property Document", view: true, upload: false, edit: false, delete: false },
  { docId: "doc_3", name: "Consultation Agreement - TechCorp.pdf", type: "Contract", view: true, upload: true, edit: true, delete: false },
  { docId: "doc_4", name: "Divorce Decree - Final.pdf", type: "Court Order", view: false, upload: false, edit: false, delete: false }
];

export default function UsersView() {
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [users, setUsers] = useState([]);

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUsername] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Modal Details State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [modalTab, setModalTab] = useState("profile"); // 'profile', 'permissions', 'documents'
  
  // Modal Edit Fields
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editCustomPerms, setEditCustomPerms] = useState({});
  const [editDocAccess, setEditDocAccess] = useState([]);

  const [notification, setNotification] = useState(null);

  // Load roles & users from backend on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const resRoles = await fetch("http://localhost:8000/permissions/roles");
        if (resRoles.ok) {
          const rolesData = await resRoles.json();
          setRoles(rolesData);
          if (rolesData.length > 0) {
            setSelectedRole(rolesData[0].name);
          }
        }
      } catch (e) {
        console.error("Error fetching roles", e);
        setRoles(DEFAULT_ROLES);
        if (DEFAULT_ROLES.length > 0) setSelectedRole(DEFAULT_ROLES[0].name);
      }

      try {
        const resUsers = await fetch("http://localhost:8000/permissions/users");
        if (resUsers.ok) {
          const usersData = await resUsers.json();
          setUsers(usersData);
        }
      } catch (e) {
        console.error("Error fetching users", e);
        setUsers(DEFAULT_USERS);
      }
    };

    loadData();
    generateRandomPassword();
  }, []);

  // Generate random password helper
  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "temp_";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(password);
  };

  const generateModalPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "temp_";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditPassword(password);
  };

  // Show notification toast helper
  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle Provisioning
  const handleProvisionUser = async (e) => {
    e.preventDefault();

    if (!selectedRole) {
      showToast("Please select a role from the tabs above", "error");
      return;
    }
    if (!username.trim()) {
      showToast("Username is required", "error");
      return;
    }
    if (!emailAddress.trim()) {
      showToast("Email address is required", "error");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/permissions/users/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phoneNumber.trim(),
          username: username.trim(),
          email: emailAddress.trim(),
          role: selectedRole,
          tempPassword: tempPassword
        })
      });

      if (res.ok) {
        const newUser = await res.json();
        setUsers((prev) => [...prev, newUser]);
        showToast(`User "${firstName || username}" provisioned successfully!`);
        
        // Reset Form
        setFirstName("");
        setLastName("");
        setPhoneNumber("");
        setUsername("");
        setEmailAddress("");
        generateRandomPassword();
      } else {
        const errData = await res.json();
        showToast(errData.detail || "Error provisioning user", "error");
      }
    } catch (err) {
      showToast("Unable to connect to the backend", "error");
    }
  };

  // Cancel form edits
  const handleCancel = () => {
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setUsername("");
    setEmailAddress("");
    generateRandomPassword();
    showToast("Provisioning cancelled", "error");
  };

  // Delete a user
  const handleDeleteUser = async (userId, uName) => {
    if (userId === "user_1" || userId === 1 || uName === "admin") {
      showToast("Cannot delete system administration user", "error");
      return;
    }
    if (confirm(`Are you sure you want to remove user "${uName}"?`)) {
      try {
        const res = await fetch(`http://localhost:8000/permissions/users/${userId}`, {
          method: "DELETE"
        });
        if (res.ok) {
          setUsers((prev) => prev.filter((u) => u.id !== userId));
          showToast(`User "${uName}" has been de-provisioned.`);
        } else {
          const errData = await res.json();
          showToast(errData.detail || "Error de-provisioning user", "error");
        }
      } catch (err) {
        showToast("Unable to connect to backend", "error");
      }
    }
  };

  // Modal actions
  const handleOpenDetails = (user) => {
    setActiveUser(user);
    setEditFirstName(user.firstName || "");
    setEditLastName(user.lastName || "");
    setEditPhone(user.phone || "");
    setEditUsername(user.username || "");
    setEditEmail(user.email || "");
    setEditPassword(user.tempPassword || "");
    
    // Ensure customPermissions is set
    setEditCustomPerms(user.customPermissions || {});
    
    // Ensure documentAccess is set (fallback to default dummy documents)
    setEditDocAccess(user.documentAccess && user.documentAccess.length > 0 
      ? user.documentAccess 
      : DEFAULT_DOCUMENTS
    );
    
    setModalTab("profile");
    setIsDetailsOpen(true);
  };

  const handleSaveModal = async () => {
    if (!editUsername.trim() || !editEmail.trim()) {
      showToast("Username and email are required", "error");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/permissions/users/${activeUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editFirstName.trim(),
          lastName: editLastName.trim(),
          phone: editPhone.trim(),
          username: editUsername.trim(),
          email: editEmail.trim(),
          tempPassword: editPassword.trim(),
          customPermissions: editCustomPerms,
          documentAccess: editDocAccess
        })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUsers((prev) => prev.map((u) => u.id === activeUser.id ? updatedUser : u));
        showToast("User details and overrides updated successfully!");
        setIsDetailsOpen(false);
      } else {
        const errData = await res.json();
        showToast(errData.detail || "Error updating user details", "error");
      }
    } catch (err) {
      showToast("Unable to connect to backend", "error");
    }
  };

  // Toggle custom permission in details modal
  const handleCustomPermissionToggle = (module, action) => {
    setEditCustomPerms((prev) => {
      const modulePermissions = prev[module] || {
        view: false,
        add: false,
        edit: false,
        delete: false,
      };

      return {
        ...prev,
        [module]: {
          ...modulePermissions,
          [action]: !modulePermissions[action],
        },
      };
    });
  };

  // Toggle document access check in details modal
  const handleDocAccessToggle = (docId, action) => {
    setEditDocAccess((prev) =>
      prev.map((doc) => {
        if (doc.docId === docId) {
          return {
            ...doc,
            [action]: !doc[action],
          };
        }
        return doc;
      })
    );
  };

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
            <ShieldCheck size={20} className="text-emerald-600" />
          )}
          <span className="font-semibold text-sm">{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
          Users Management
        </h1>
        <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
          Create and link user accounts with profile-specific cascading filters.
        </p>
      </div>

      {/* Main card containing Creation panel */}
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        {/* Form header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-11 h-11 bg-slate-100 text-slate-800 rounded-full flex items-center justify-center">
            <UserPlus size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Create New User
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Provision a user credentials and map their security role
            </p>
          </div>
        </div>

        {/* Dynamic role selection tabs */}
        <div className="mb-8">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
            Select User Role Tab
          </label>
          <div className="flex flex-wrap items-center gap-2.5">
            {roles.map((role) => {
              const active = selectedRole === role.name;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.name)}
                  className={`px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    active
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700 ring-2 ring-slate-200 font-extrabold"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {role.name}
                </button>
              );
            })}

            {/* NEW role button */}
            <button
              type="button"
              onClick={() => router.push("/permissions/roles")}
              className="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>NEW</span>
            </button>
          </div>
        </div>

        {/* User Details Form */}
        <form onSubmit={handleProvisionUser} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* First Name */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                First Name
              </label>
              <input
                type="text"
                placeholder="Jane"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
              />
            </div>

            {/* Last Name */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Last Name
              </label>
              <input
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
              />
            </div>

            {/* Phone Number */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
              />
            </div>

            {/* Username */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Username *
              </label>
              <input
                type="text"
                placeholder="Unique username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
              />
            </div>

            {/* Email Address */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Email Address *
              </label>
              <input
                type="email"
                placeholder="example@legaltech.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
              />
            </div>

            {/* Temp Password */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Temp Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-4 pr-24 py-3 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                    title="Regenerate password"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-50">
            <button
              type="submit"
              className="px-8 py-3.5 bg-black text-white hover:bg-slate-800 text-xs font-bold uppercase rounded-full cursor-pointer tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <Check size={16} />
              <span>Provision User</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase rounded-full cursor-pointer tracking-wider transition-all flex items-center justify-center"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Provisioned Users Table */}
{/* Provisioned Users Table */}
<div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
  <div className="px-8 py-6 border-b border-slate-100">
    <h2 className="text-xl font-bold text-slate-900">
      Active Provisioned Users
    </h2>
    <p className="text-xs text-slate-400 mt-1">
      {users.length} user{users.length !== 1 ? "s" : ""} available
    </p>
  </div>

  <table className="w-full border-collapse text-left">
    <thead>
      <tr className="bg-slate-50 border-b border-slate-100">
        <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase">
          Profile Name
        </th>
        <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase">
          Role
        </th>
        <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase text-center">
          Status
        </th>
        <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase text-center">
          Action
        </th>
      </tr>
    </thead>

    <tbody>
      {users.length === 0 ? (
        <tr>
          <td colSpan={4} className="py-12 text-center text-slate-400 text-sm">
            No users available
          </td>
        </tr>
      ) : (
        users.map((user, idx) => {
          const avatarColors = [
            "bg-indigo-600",
            "bg-blue-600",
            "bg-emerald-600",
            "bg-violet-600",
            "bg-rose-600",
          ];

          const avatarBg = avatarColors[idx % avatarColors.length];

          return (
            <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
              
              {/* Profile */}
              <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${avatarBg} text-white flex items-center justify-center font-bold`}
                  >
                    {(user.firstName || user.username || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-slate-400">@{user.username}</p>
                  </div>
                </div>
              </td>

              {/* Role */}
              <td className="py-4 px-6">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  {user.role}
                </span>
              </td>

              {/* Status */}
              <td className="py-4 px-6 text-center">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Active
                </span>
              </td>

              {/* Action */}
              <td className="py-4 px-6 text-center">
                <button
                  onClick={() => handleOpenDetails(user)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  View
                </button>
              </td>

            </tr>
          );
        })
      )}
    </tbody>
  </table>
</div>

      {/* ─── Edit Info & Direct Override Modal ─── */}

 {/* ─── Edit Info & Direct Override Modal ─── */}
{isDetailsOpen && activeUser && (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md px-4 py-6 overflow-y-auto"
    onClick={() => setIsDetailsOpen(false)}
  >
    {/* Modal */}
    <div
      onClick={(e) => e.stopPropagation()}
      className="relative bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 my-auto"
    >
      {/* Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
              {(editFirstName || editUsername || "?")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <h3 className="text-white font-bold text-2xl">
                {editFirstName} {editLastName}
              </h3>
              <p className="text-slate-400 text-sm">@{editUsername}</p>

              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
                  {activeUser.role}
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                  Active
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsDetailsOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info strip */}
        <div className="flex flex-wrap gap-6 mt-5 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Mail size={12} />
            {editEmail}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Phone size={12} />
            {editPhone || "No phone"}
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <Key size={12} />
            <code>{editPassword}</code>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-100 bg-white px-6 gap-2 overflow-x-auto">
        {[
          { key: "profile", icon: <User size={15} />, label: "Profile Info" },
          {
            key: "permissions",
            icon: <Settings size={15} />,
            label: "Direct Permissions",
          },
          {
            key: "documents",
            icon: <FileText size={15} />,
            label: "Document Access",
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setModalTab(tab.key)}
            className={`flex items-center gap-2 py-4 px-5 text-xs font-bold uppercase border-b-2 whitespace-nowrap ${
              modalTab === tab.key
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-[60vh] overflow-y-auto bg-slate-50">
        
        {/* Profile */}
        {modalTab === "profile" && (
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              ["First Name", editFirstName, setEditFirstName],
              ["Last Name", editLastName, setEditLastName],
              ["Phone Number", editPhone, setEditPhone],
              ["Username", editUsername, setEditUsername],
              ["Email Address", editEmail, setEditEmail],
            ].map(([label, value, setter]) => (
              <div key={label}>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                  {label}
                </label>
                <input
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>
            ))}
          </div>
        )}

        {/* Permissions */}
        {modalTab === "permissions" && (
          <div className="p-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="py-3 px-4 text-left">Module</th>
                    {ACTIONS.map((act) => (
                      <th key={act} className="py-3 px-4 text-center">
                        {act}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {getModulesForRole(activeUser.role).map(({ key, label }) => {
                    const perms = editCustomPerms[key] || {};
                    return (
                      <tr key={key} className="border-b">
                        <td className="py-3 px-4 font-medium">{label}</td>

                        {ACTIONS.map((action) => (
                          <td key={action} className="text-center">
                            <input
                              type="checkbox"
                              checked={perms[action] || false}
                              onChange={() =>
                                handleCustomPermissionToggle(key, action)
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Documents */}
        {modalTab === "documents" && (
          <div className="p-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="py-3 px-4 text-left">Document</th>
                    <th className="py-3 px-4 text-left">Type</th>
                    {["view", "upload", "edit", "delete"].map((act) => (
                      <th key={act} className="py-3 px-4 text-center">
                        {act}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {editDocAccess.map((doc) => (
                    <tr key={doc.docId} className="border-b">
                      <td className="py-3 px-4">{doc.name}</td>
                      <td className="py-3 px-4">{doc.type}</td>

                      {["view", "upload", "edit", "delete"].map((act) => (
                        <td key={act} className="text-center">
                          <input
                            type="checkbox"
                            checked={doc[act] || false}
                            onChange={() =>
                              handleDocAccessToggle(doc.docId, act)
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end gap-3">
        <button
          onClick={() => setIsDetailsOpen(false)}
          className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
        >
          Cancel
        </button>

        <button
          onClick={handleSaveModal}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
