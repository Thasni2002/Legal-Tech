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
    key: mod,
    label: overrides[mod] || mod,
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

  // Load roles & users from localStorage on mount
  useEffect(() => {
    // Roles
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

    // Set default selected role
    if (currentRoles.length > 0) {
      setSelectedRole(currentRoles[0].name);
    }

    // Users
    const storedUsers = localStorage.getItem("legal_tech_users");
    let currentUsers = DEFAULT_USERS;
    if (storedUsers) {
      try {
        const parsed = JSON.parse(storedUsers);
        const hasOldUserRole = parsed.some(
          (u) => u.role === "SuperAdmin" || u.role === "teacher"
        );
        if (hasOldUserRole) {
          currentUsers = DEFAULT_USERS;
          localStorage.setItem("legal_tech_users", JSON.stringify(DEFAULT_USERS));
        } else {
          currentUsers = parsed;
        }
      } catch (e) {
        currentUsers = DEFAULT_USERS;
      }
    } else {
      localStorage.setItem("legal_tech_users", JSON.stringify(DEFAULT_USERS));
    }
    setUsers(currentUsers);

    // Generate initial password
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
  const handleProvisionUser = (e) => {
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

    // Verify uniqueness
    const userExists = users.some(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() ||
        u.email.toLowerCase() === emailAddress.trim().toLowerCase()
    );
    if (userExists) {
      showToast("Username or Email already exists in the system", "error");
      return;
    }

    const newUser = {
      id: "user_" + Date.now(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phoneNumber.trim(),
      username: username.trim(),
      email: emailAddress.trim(),
      role: selectedRole,
      tempPassword: tempPassword,
      customPermissions: {},
      documentAccess: DEFAULT_DOCUMENTS
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem("legal_tech_users", JSON.stringify(updatedUsers));

    showToast(`User "${firstName || username}" provisioned successfully!`);

    // Reset Form (except password which regenerates)
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setUsername("");
    setEmailAddress("");
    generateRandomPassword();
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
  const handleDeleteUser = (userId, uName) => {
    if (userId === "user_1") {
      showToast("Cannot delete system administration user", "error");
      return;
    }
    if (confirm(`Are you sure you want to remove user "${uName}"?`)) {
      const updatedUsers = users.filter((u) => u.id !== userId);
      setUsers(updatedUsers);
      localStorage.setItem("legal_tech_users", JSON.stringify(updatedUsers));
      showToast(`User "${uName}" has been de-provisioned.`);
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

  const handleSaveModal = () => {
    if (!editUsername.trim() || !editEmail.trim()) {
      showToast("Username and email are required", "error");
      return;
    }

    const updatedUsers = users.map((u) => {
      if (u.id === activeUser.id) {
        return {
          ...u,
          firstName: editFirstName.trim(),
          lastName: editLastName.trim(),
          phone: editPhone.trim(),
          username: editUsername.trim(),
          email: editEmail.trim(),
          tempPassword: editPassword.trim(),
          customPermissions: editCustomPerms,
          documentAccess: editDocAccess
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    localStorage.setItem("legal_tech_users", JSON.stringify(updatedUsers));
    showToast("User details and overrides updated successfully!");
    setIsDetailsOpen(false);
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

      {/* Provisioned Users List */}
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6">
          Active Provisioned Users
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {users.map((user) => {
            const hasOverrides = user.customPermissions && Object.keys(user.customPermissions).length > 0;
            return (
              <div
                key={user.id}
                className="relative group border border-slate-100 hover:border-[#2563EB] hover:bg-blue-50/10 p-5 rounded-2xl transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                        {user.firstName ? user.firstName.charAt(0) : user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {user.firstName} {user.lastName}
                        </h3>
                        <span className="inline-block px-2.5 py-0.5 mt-1 rounded-full text-xxs font-bold uppercase tracking-wider bg-emerald-50 text-[#2563EB] border border-emerald-100">
                          {user.role}
                        </span>
                        {hasOverrides && (
                          <span className="inline-block px-2.5 py-0.5 mt-1 ml-1.5 rounded-full text-xxs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                            Custom Matrix
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 items-end">
                      <button
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        disabled={user.id === "user_1"}
                        className={`text-xxs font-bold py-1 px-2.5 rounded-lg border transition-all cursor-pointer ${
                          user.id === "user_1"
                            ? "text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed"
                            : "text-red-500 border-red-100 hover:bg-red-50 hover:border-red-200"
                        }`}
                      >
                        De-provision
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2 border-t border-slate-100/80 pt-4 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-slate-400" />
                      <span className="text-slate-400 font-bold uppercase tracking-wider w-18">Username:</span>
                      <span className="text-slate-900">{user.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      <span className="text-slate-400 font-bold uppercase tracking-wider w-18">Email:</span>
                      <span className="text-slate-900 truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      <span className="text-slate-400 font-bold uppercase tracking-wider w-18">Phone:</span>
                      <span className="text-slate-900">{user.phone || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl mt-3 border border-slate-100">
                      <Key size={14} className="text-[#16A34A]" />
                      <span className="text-slate-400 font-bold uppercase tracking-wider w-18">Temp Pass:</span>
                      <code className="text-[#16A34A] bg-[#F1F5F9] px-2 py-0.5 rounded font-mono text-xxs font-bold">
                        {user.tempPassword}
                      </code>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-50">
                  <button
                    onClick={() => handleOpenDetails(user)}
                    className="w-full text-center text-xs font-bold py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Edit Info & Direct Override
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Details, Direct Permissions Override & Case Related Documents Modal */}
      {isDetailsOpen && activeUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsDetailsOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl w-full max-w-4xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  {editFirstName ? editFirstName.charAt(0) : editUsername.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {editFirstName} {editLastName}
                  </h3>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider bg-emerald-50 text-[#2563EB] border border-emerald-100">
                    {activeUser.role} Account Detail
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-slate-100 px-6 bg-white">
              <button
                onClick={() => setModalTab("profile")}
                className={`py-4 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  modalTab === "profile"
                    ? "border-[#2563EB] text-[#2563EB]"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <User size={16} />
                <span>Profile Info</span>
              </button>
              <button
                onClick={() => setModalTab("permissions")}
                className={`py-4 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  modalTab === "permissions"
                    ? "border-[#2563EB] text-[#2563EB]"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <Settings size={16} />
                <span>Direct Permissions</span>
              </button>
              <button
                onClick={() => setModalTab("documents")}
                className={`py-4 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  modalTab === "documents"
                    ? "border-[#2563EB] text-[#2563EB]"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <FileText size={16} />
                <span>Case Related Documents</span>
              </button>
            </div>

            {/* Content Panel */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Tab 1: Profile Edit */}
              {modalTab === "profile" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Temp Password
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-4 pr-12 py-3 text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
                      />
                      <button
                        type="button"
                        onClick={generateModalPassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                        title="Regenerate password"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Direct Custom Permissions */}
              {modalTab === "permissions" && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs font-semibold">
                      <p className="font-bold uppercase tracking-wider">Direct Permissions Override Active</p>
                      <p className="mt-1 text-amber-700/90 font-medium normal-case">
                        Configuring these fields assigns direct access controls that bypass the user's role default of ({activeUser.role}). Leave unchecked to fallback to role permissions.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="py-4 px-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Module</th>
                          {ACTIONS.map(act => (
                            <th key={act} className="py-4 px-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-24">{act}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {getModulesForRole(activeUser.role, true).map(({ key, label }) => {
                          const modulePermissions = editCustomPerms[key] || {
                            view: false,
                            add: false,
                            edit: false,
                            delete: false,
                          };

                          return (
                            <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 px-5 font-bold text-slate-800 text-xs">{label}</td>
                              {ACTIONS.map(action => (
                                <td key={action} className="py-3.5 px-5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={modulePermissions[action] || false}
                                    onChange={() => handleCustomPermissionToggle(key, action)}
                                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 accent-[#0d6e53] cursor-pointer"
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

              {/* Tab 3: Case Document Permissions */}
              {modalTab === "documents" && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-4 text-[#2563EB] flex items-start gap-3">
                    <Shield size={18} className="text-[#2563EB] flex-shrink-0 mt-0.5" />
                    <div className="text-xs font-semibold">
                      <p className="font-bold uppercase tracking-wider">Case Related Document clearance level</p>
                      <p className="mt-1 text-slate-500 font-medium normal-case">
                        Define which case documents and lawsuit files this specific user has access clearance to.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="py-4 px-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Case Documents</th>
                          <th className="py-4 px-5 text-xs font-bold text-slate-400 uppercase tracking-wider w-36">Doc Type</th>
                          <th className="py-4 px-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-20">View</th>
                          <th className="py-4 px-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-20">Upload</th>
                          <th className="py-4 px-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-20">Edit</th>
                          <th className="py-4 px-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-20">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {editDocAccess.map((doc) => (
                          <tr key={doc.docId} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-2">
                                <FileText size={15} className="text-slate-400 flex-shrink-0" />
                                <span className="font-bold text-slate-800 text-xs">{doc.name}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-5">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-xxs uppercase tracking-wider">
                                {doc.type}
                              </span>
                            </td>
                            {["view", "upload", "edit", "delete"].map((act) => (
                              <td key={act} className="py-3.5 px-5 text-center">
                                <input
                                  type="checkbox"
                                  checked={doc[act] || false}
                                  onChange={() => handleDocAccessToggle(doc.docId, act)}
                                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 accent-[#0d6e53] cursor-pointer"
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
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold uppercase rounded-full cursor-pointer tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-6 py-2.5 bg-black text-white hover:bg-slate-800 text-xs font-bold uppercase rounded-full cursor-pointer tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
