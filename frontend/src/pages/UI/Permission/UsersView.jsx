"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { 
  UserPlus, Key, Eye, EyeOff, RefreshCw, AlertTriangle, 
  ShieldCheck, Mail, Phone, User, Check, X, FileText, Settings, Shield, Plus
} from "lucide-react";

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

const getModuleCategories = (roleName) => {
  const normRole = (roleName || "").toLowerCase().replace(/\s+/g, "");
  let dashboardLabel = "Dashboard";
  if (normRole.includes("senior")) {
    dashboardLabel = "Dashboard (Senior Advocate)";
  } else if (normRole.includes("junior")) {
    dashboardLabel = "Dashboard (Junior Advocate)";
  } else if (normRole.includes("client")) {
    dashboardLabel = "Dashboard (Client)";
  }

  return [
    {
      category: "General",
      modules: [
        { key: "Dashboard", label: dashboardLabel }
      ]
    },
    {
      category: "Senior Advocate / Law Firm Features",
      modules: [
        { key: "Law Firm Management", label: "Law Firm Management" },
        { key: "Client Management", label: "Client Management" },
        { key: "Case Management", label: "Case Management" },
        { key: "Consultations", label: "Case Discussion (Senior)" },
        { key: "Finance Management", label: "Finance Management" },
        { key: "Calendar", label: "Calendar" },
        { key: "Profile", label: "Profile" }
      ]
    },
    {
      category: "Junior Advocate Features",
      modules: [
        { key: "Assigned Cases", label: "Assigned Cases" },
        { key: "Client Section", label: "Client Section (Junior)" }
      ]
    },
    {
      category: "Client Features",
      modules: [
        { key: "Consultation", label: "Case Discussion (Client)" },
        { key: "Case Tracking", label: "Case Tracking" },
        { key: "Documents", label: "Documents" },
        { key: "Payments", label: "Payments" }
      ]
    },
    {
      category: "System / Law Firm Administration",
      modules: [
        { key: "User Roles", label: "User Roles" },
        { key: "Roles", label: "Roles" },
        { key: "Users", label: "Users" },
        { key: "Permissions", label: "Permissions" }
      ]
    }
  ];
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
  const [tempPassword, setTempPassword] = useState(() => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "temp_";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  });
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

  const [mounted, setMounted] = useState(false);
  const [provisionedUser, setProvisionedUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletedUsername, setDeletedUsername] = useState("");
  const [deletedUserRole, setDeletedUserRole] = useState("");

  // Helper to format role names dynamically for modal and button text
  const getRoleDisplayName = (roleName) => {
    if (!roleName) return "User";
    const lower = roleName.toLowerCase();
    if (lower.includes("senior")) return "Senior";
    if (lower.includes("junior") || lower.includes("client")) return "User";
    return roleName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

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
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

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
        
        // Show success modal overlaying the page
        setProvisionedUser(newUser);
        
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

  // Trigger Delete Confirmation Modal
  const handleDeleteUserClick = (userId, uName, uRole) => {
    if (userId === "user_1" || userId === 1 || uName === "admin") {
      showToast("Cannot delete system administration user", "error");
      return;
    }
    setDeleteTarget({ id: userId, username: uName, role: uRole });
  };

  // Execute Deletion after confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { id, username, role } = deleteTarget;
    try {
      const res = await fetch(`http://localhost:8000/permissions/users/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setDeleteTarget(null);
        setDeletedUsername(username);
        setDeletedUserRole(role || "");
      } else {
        const errData = await res.json();
        showToast(errData.detail || `Error de-provisioning ${getRoleDisplayName(role).toLowerCase()}`, "error");
        setDeleteTarget(null);
      }
    } catch (err) {
      showToast("Unable to connect to backend", "error");
      setDeleteTarget(null);
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
                      ? "bg-black text-white shadow-md"
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
              className="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider border border-dashed border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400 hover:bg-slate-50/50 transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus size={14} />
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
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 placeholder:text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
      />
    </div>

    {/* Last Name */}
    <div className="flex flex-col">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        Last Name
      </label>
      <input
        type="text"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 placeholder:text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
      />
    </div>

    {/* Phone Number */}
    <div className="flex flex-col">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        Phone Number
      </label>

      <input
        type="tel"
        value={phoneNumber}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, "");

          if (value.length <= 10) {
            setPhoneNumber(value);
          }
        }}
        maxLength={10}
        className={`w-full rounded-xl border px-4 py-3 text-slate-800 placeholder:text-slate-700 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm font-medium ${
          phoneNumber &&
          !/^[6-9][0-9]{9}$/.test(phoneNumber)
            ? "border-red-400 focus:border-red-500"
            : "border-slate-200 focus:border-[#2563EB]"
        }`}
      />

      {phoneNumber &&
        !/^[6-9][0-9]{9}$/.test(phoneNumber) && (
          <p className="mt-2 text-xs font-medium text-red-500">
            Enter a valid Indian mobile number
          </p>
        )}
    </div>

    {/* Username */}
    <div className="flex flex-col">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        Username *
      </label>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 placeholder:text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
      />
    </div>

    {/* Email Address */}
    <div className="flex flex-col">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        Email Address *
      </label>
      <input
        type="email"
        value={emailAddress}
        onChange={(e) => setEmailAddress(e.target.value)}
        required
        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 placeholder:text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
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
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-4 pr-24 py-3 text-slate-800 placeholder:text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          >
            {showPassword ? (
              <EyeOff size={16} />
            ) : (
              <Eye size={16} />
            )}
          </button>

          <button
            type="button"
            onClick={generateRandomPassword}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
    </div>
  </div>

  {/* Buttons */}
  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-50">
    <button
      type="submit"
      className="px-8 py-3.5 bg-black text-white hover:bg-slate-800 text-xs font-bold uppercase rounded-full cursor-pointer tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
    >
      <Check size={16} />
      <span>Provision {getRoleDisplayName(selectedRole)}</span>
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
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleOpenDetails(user)}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteUserClick(user.id, user.username, user.role)}
                    className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </td>

            </tr>
          );
        })
      )}
    </tbody>
  </table>
</div>

      {/* ─── Edit Info & Direct Override Modal ─── */}
      {mounted && typeof window !== "undefined" && isDetailsOpen && activeUser ? createPortal(
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
                }
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
                        {getModuleCategories(activeUser.role).map((cat) => (
                          <React.Fragment key={cat.category}>
                            {/* Category Header Row */}
                            <tr>
                              <td
                                colSpan={5}
                                className="py-2.5 px-4 font-bold text-xs uppercase tracking-wider text-slate-600 bg-slate-100 border-y border-slate-200"
                              >
                                {cat.category}
                              </td>
                            </tr>
                            {/* Modules Rows */}
                            {cat.modules.map(({ key, label }) => {
                              const perms = editCustomPerms[key] || {};
                              return (
                                <tr key={key} className="border-b hover:bg-slate-50">
                                  <td className="py-3 px-6 font-medium text-slate-800 text-sm pl-8">
                                    {label}
                                  </td>

                                  {ACTIONS.map((action) => (
                                    <td key={action} className="text-center py-3">
                                      <input
                                        type="checkbox"
                                        checked={perms[action] || false}
                                        onChange={() =>
                                          handleCustomPermissionToggle(key, action)
                                        }
                                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                      />
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))}
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
        </div>,
        document.body
      ) : null}

      {/* ─── Success Modal for Provisioned User ─── */}
      {mounted && typeof window !== "undefined" && provisionedUser ? createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 py-6 overflow-y-auto"
          onClick={() => setProvisionedUser(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header Success Section */}
            <div className="bg-emerald-50 py-8 px-6 flex flex-col items-center border-b border-slate-100 text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-200">
                <Check size={32} strokeWidth={3} />
              </div>
              <h3 className="text-slate-900 font-extrabold text-2xl text-center">
                Create New {getRoleDisplayName(provisionedUser.role)} Successfully
              </h3>
              <p className="text-slate-500 text-xs mt-1.5 font-medium max-w-xs text-center">
                A new {getRoleDisplayName(provisionedUser.role).toLowerCase()} account has been successfully created and linked with the mapped security role.
              </p>
            </div>

            {/* Info Section */}
            <div className="p-6 space-y-4 text-slate-700">
              <div className="grid grid-cols-2 gap-4 text-sm font-medium">
                <div>
                  <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Role</span>
                  <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded text-xs inline-block mt-1">
                    {provisionedUser.role}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Full Name</span>
                  <span className="text-slate-800 font-semibold block mt-1">
                    {provisionedUser.firstName || "-"} {provisionedUser.lastName || ""}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Username</span>
                  <span className="text-slate-800 font-semibold block mt-1">
                    @{provisionedUser.username}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Email Address</span>
                  <span className="text-slate-800 font-semibold block mt-1 truncate">
                    {provisionedUser.email}
                  </span>
                </div>
              </div>

              {/* Temporary Password Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  Temporary Password
                </span>
                <div className="flex items-center justify-between">
                  <code className="text-[#2563EB] font-bold text-sm select-all">
                    {provisionedUser.tempPassword}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(provisionedUser.tempPassword);
                      showToast("Password copied to clipboard!");
                    }}
                    className="text-[10px] font-extrabold uppercase bg-blue-50 hover:bg-blue-100 text-[#2563EB] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setProvisionedUser(null)}
                className="bg-black hover:bg-slate-800 text-white text-xs font-bold uppercase py-3 px-6 rounded-full cursor-pointer tracking-wider transition-all shadow-md active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}

      {/* ─── Custom Delete Confirmation Modal ─── */}
      {mounted && typeof window !== "undefined" && deleteTarget ? createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 py-6 overflow-y-auto"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header / Warning Icon */}
            <div className="bg-red-50 py-8 px-6 flex flex-col items-center border-b border-slate-100 text-center">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-red-200 animate-pulse">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-slate-900 font-extrabold text-2xl">
                Delete {getRoleDisplayName(deleteTarget.role)} Account?
              </h3>
              <p className="text-slate-500 text-xs mt-1.5 font-medium max-w-xs">
                Are you sure you want to remove {getRoleDisplayName(deleteTarget.role).toLowerCase()} <strong className="text-red-600">@{deleteTarget.username}</strong>? This action cannot be undone.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-5 bg-slate-50 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-6 py-3 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Delete {getRoleDisplayName(deleteTarget.role)}
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}

      {/* ─── Delete Success Modal ─── */}
      {mounted && typeof window !== "undefined" && deletedUsername ? createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 py-6 overflow-y-auto"
          onClick={() => {
            setDeletedUsername("");
            setDeletedUserRole("");
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header Success Section */}
            <div className="bg-red-50 py-8 px-6 flex flex-col items-center border-b border-slate-100 text-center">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-red-200">
                <Check size={32} strokeWidth={3} />
              </div>
              <h3 className="text-slate-900 font-extrabold text-2xl text-center">
                Delete {getRoleDisplayName(deletedUserRole)} Successfully
              </h3>
              <p className="text-slate-500 text-xs mt-1.5 font-medium max-w-xs text-center">
                The {getRoleDisplayName(deletedUserRole).toLowerCase()} account <strong className="text-slate-900">@{deletedUsername}</strong> has been completely de-provisioned and deleted from the database.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 flex justify-end">
              <button
                onClick={() => {
                  setDeletedUsername("");
                  setDeletedUserRole("");
                }}
                className="bg-black hover:bg-slate-800 text-white text-xs font-bold uppercase py-3 px-6 rounded-full cursor-pointer tracking-wider transition-all shadow-md active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
}
