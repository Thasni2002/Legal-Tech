"use client";

import { API_BASE_URL } from "@/utils/api";

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
  { id: "client", name: "Client", description: "Client access" },
  { id: "clerk", name: "Clerk", description: "Clerk access" }
];



const ACTIONS = ["view", "add", "edit", "delete"];

// Base module keys (internal, used for localStorage storage)
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
  "Document Draft",
  "Format Physical File",
  "Case Number from Court",
];

const SENIOR_JUNIOR_MODULES = [
  {
    category: "Senior Advocate / Law Firm Features",
    modules: [
      { key: "Dashboard", label: "Dashboard" },
      { key: "Law Firm Management", label: "Law Firm Management" },
      { key: "Client Management", label: "Client Management" },
      { key: "Case Management", label: "Case Management" },
      { key: "Consultations", label: "Case Discussion (Senior)" },
      { key: "Finance Management", label: "Finance Management" },
      { key: "Calendar", label: "Calendar" },
      { key: "Assigned Tasks", label: "Assigned Tasks" },
      { key: "Profile", label: "Profile" }
    ]
  },
  {
    category: "Junior Advocate Features",
    modules: [
      { key: "Junior Dashboard", label: "Dashboard (Junior)" },
      { key: "Assigned Cases", label: "Assigned Cases" },
      { key: "Junior Assigned Tasks", label: "Assigned Tasks (Junior)" },
      { key: "Junior Calendar", label: "Calendar (Junior)" }
    ]
  },
  {
    category: "Client Section Features",
    modules: [
      { key: "Client Dashboard", label: "Dashboard (Client)" },
      { key: "Consultation", label: "Case Discussion (Client)" },
      { key: "Case Tracking", label: "Case Tracking" },
      { key: "Client Document Generate", label: "Document Format Generate" },
      { key: "Documents", label: "Documents" },
      { key: "Payments", label: "Payments" }
    ]
  },
  {
    category: "System / Administration",
    modules: [
      { key: "User Roles", label: "User Roles" },
      { key: "Roles", label: "Roles" },
      { key: "Users", label: "Users" },
      { key: "Permissions", label: "Permissions" }
    ]
  },
  {
    category: "Clerk Features",
    modules: [
      { key: "Clerk Dashboard", label: "Dashboard (Clerk)" },
      { key: "Document Draft", label: "Document Draft" },
      { key: "Format Physical File", label: "Format Physical File" },
      { key: "Case Number from Court", label: "Case Number from Court" }
    ]
  }
];


const CLIENT_MODULES = [
  {
    category: "Client Section Features",
    modules: [
      { key: "Client Dashboard", label: "Dashboard (Client)" },
      { key: "Consultation", label: "Case Discussion (Client)" },
      { key: "Case Tracking", label: "Case Tracking" },
      { key: "Client Document Generate", label: "Document Format Generate" },
      { key: "Documents", label: "Documents" },
      { key: "Payments", label: "Payments" }
    ]
  }
];

const getModuleCategories = (roleName) => {
  const normalized = (roleName || "").toLowerCase().replace(/\s+/g, "");
  if (normalized === "client") return CLIENT_MODULES;
  return SENIOR_JUNIOR_MODULES; // Senior Advocate & Junior Advocate see all sections
};

const DEFAULT_DOCUMENTS = [
  { docId: "doc_1", name: "Smith v. State - Case Brief.pdf", type: "Case File", view: true, upload: true, edit: false, delete: false },
  { docId: "doc_2", name: "Land Title Deed - John Doe.pdf", type: "Property Document", view: true, upload: false, edit: false, delete: false },
  { docId: "doc_3", name: "Consultation Agreement - TechCorp.pdf", type: "Contract", view: true, upload: true, edit: true, delete: false },
  { docId: "doc_4", name: "Divorce Decree - Final.pdf", type: "Court Order", view: false, upload: false, edit: false, delete: false }
];

const findRolePermissions = (allPerms, roleName) => {
  if (!allPerms || !roleName) return {};
  const roleKey = Object.keys(allPerms).find(
    (k) => k.toLowerCase().replace(/\s+/g, "") === roleName.toLowerCase().replace(/\s+/g, "")
  );
  return roleKey ? allPerms[roleKey] : {};
};

export default function UsersView() {
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("All");
  const [rolePermissions, setRolePermissions] = useState({}); // default permissions per role

  // Advocate auto-fill states
  const [advocates, setAdvocates] = useState([]);
  const [selectedAdvocateId, setSelectedAdvocateId] = useState("");

  // Client auto-fill states
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");


  const [confirmPassword, setConfirmPassword] = useState("");

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
  const [deleteImpact, setDeleteImpact] = useState(null);
  const [impactLoading, setImpactLoading] = useState(false);
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

 

  // Load roles & users from backend on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const resRoles = await fetch(`${API_BASE_URL}/permissions/roles`);
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
        const resUsers = await fetch(`${API_BASE_URL}/permissions/users`);
        if (resUsers.ok) {
          const usersData = await resUsers.json();
          setUsers(usersData);
        }
      } catch (e) {
        console.error("Error fetching users", e);
        setUsers(DEFAULT_USERS);
      }

      try {
        const resAdv = await fetch(`${API_BASE_URL}/lawfirm-management/`);
        if (resAdv.ok) {
          setAdvocates(await resAdv.json());
        }
      } catch (e) {
        console.error("Error fetching advocates", e);
      }

      try {
        const resCases = await fetch(`${API_BASE_URL}/case-management/`);
        if (resCases.ok) {
          const casesData = await resCases.json();
          const uniqueClientsMap = new Map();
          casesData.forEach(c => {
            const clientName = c.clientName || c.client_name;
            const emailId = c.emailId || c.email_id;
            const contactNumber = c.contactNumber || c.contact_number;

            if (clientName) {
              const key = `${clientName.trim().toLowerCase()}_${(emailId || "").trim().toLowerCase()}`;
              if (!uniqueClientsMap.has(key)) {
                uniqueClientsMap.set(key, {
                  id: key, // using composite key as unique id
                  clientName: clientName,
                  contactNumber: contactNumber || "",
                  emailId: emailId || ""
                });
              }
            }
          });
          setClients(Array.from(uniqueClientsMap.values()));
        }
      } catch (e) {
        console.error("Error fetching cases for clients", e);
      }
    };

    loadData();
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  // Fetch global role permissions (used to pre-populate Direct Permissions)
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/permissions`);
        if (res.ok) {
          setRolePermissions(await res.json());
        }
      } catch (e) {
        // silently ignore — checkboxes will just start empty
      }
    };
    loadPermissions();
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
    if (!firstName.trim()) {
      showToast("First name is required", "error");
      return;
    }
    if (!lastName.trim()) {
      showToast("Last name is required", "error");
      return;
    }
    if (!phoneNumber.trim()) {
      showToast("Phone number is required", "error");
      return;
    }
    if (!/^[6-9][0-9]{9}$/.test(phoneNumber.trim())) {
      showToast("Please enter a valid Indian mobile number", "error");
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
    if (!tempPassword.trim()) {
      showToast("Temporary password is required", "error");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/permissions/users/provision`, {
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

  // Trigger Delete Confirmation Modal — fetch impact first
  const handleDeleteUserClick = async (userId, uName, uRole) => {
    if (userId === "user_1" || userId === 1 || uName === "admin") {
      showToast("Cannot delete system administration user", "error");
      return;
    }
    setImpactLoading(true);
    setDeleteImpact(null);
    setDeleteTarget({ id: userId, username: uName, role: uRole });
    try {
      const res = await fetch(`${API_BASE_URL}/permissions/users/${userId}/delete-impact`);
      if (res.ok) {
        const impact = await res.json();
        setDeleteImpact(impact);
      } else {
        setDeleteImpact({ has_impact: false, assigned_cases: [], cases: [], total: 0 });
      }
    } catch (_) {
      setDeleteImpact({ has_impact: false, assigned_cases: [], cases: [], total: 0 });
    } finally {
      setImpactLoading(false);
    }
  };

  // Execute Deletion after confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { id, username, role } = deleteTarget;
    try {
      const res = await fetch(`${API_BASE_URL}/permissions/users/${id}`, {
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

  // Modal actions — fetch fresh role permissions every time modal opens
  const handleOpenDetails = async (user) => {
    setActiveUser(user);
    setEditFirstName(user.firstName || "");
    setEditLastName(user.lastName || "");
    setEditPhone(user.phone || "");
    setEditUsername(user.username || "");
    setEditEmail(user.email || "");
    setEditPassword("");
    setConfirmPassword("");

    setEditDocAccess(user.documentAccess && user.documentAccess.length > 0
      ? user.documentAccess
      : DEFAULT_DOCUMENTS
    );

    // Always fetch latest role permissions from API to stay in sync with PermissionView
    try {
      const res = await fetch(`${API_BASE_URL}/permissions`);
      let basePerms = {};
      if (res.ok) {
        const freshPerms = await res.json();
        setRolePermissions(freshPerms); // also update cached state
        basePerms = findRolePermissions(freshPerms, user.role);
      } else {
        basePerms = findRolePermissions(rolePermissions, user.role);
      }

      const hasCustom = user.customPermissions && Object.keys(user.customPermissions).length > 0;
      if (hasCustom) {
        // Deep merge role defaults with user's custom overrides
        const merged = JSON.parse(JSON.stringify(basePerms));
        for (const mod in user.customPermissions) {
          merged[mod] = { ...(merged[mod] || {}), ...user.customPermissions[mod] };
        }
        setEditCustomPerms(merged);
      } else {
        setEditCustomPerms(basePerms);
      }
    } catch (_) {
      const fallbackBase = findRolePermissions(rolePermissions, user.role);
      const hasCustom = user.customPermissions && Object.keys(user.customPermissions).length > 0;
      if (hasCustom) {
        const merged = JSON.parse(JSON.stringify(fallbackBase));
        for (const mod in user.customPermissions) {
          merged[mod] = { ...(merged[mod] || {}), ...user.customPermissions[mod] };
        }
        setEditCustomPerms(merged);
      } else {
        setEditCustomPerms(fallbackBase);
      }
    }

    setModalTab("profile");
    setIsDetailsOpen(true);
  };


  const handleSaveModal = async () => {
    if (!editUsername.trim() || !editEmail.trim()) {
      showToast("Username and email are required", "error");
      return;
    }
    if (editPassword && editPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    try {
      // Fetch fresh role defaults to compute diff
      let currentRolePerms = {};
      try {
        const resRole = await fetch(`${API_BASE_URL}/permissions`);
        if (resRole.ok) {
          const allPerms = await resRole.json();
          currentRolePerms = findRolePermissions(allPerms, activeUser.role);
        }
      } catch (_) {
        currentRolePerms = findRolePermissions(rolePermissions, activeUser.role);
      }

      // Compute diff: Only save what differs from the global role defaults
      const diffPerms = {};
      for (const mod in editCustomPerms) {
        const modPerms = editCustomPerms[mod];
        const baseModPerms = currentRolePerms[mod] || { view: false, add: false, edit: false, delete: false };

        let hasDiff = false;
        for (const act of ["view", "add", "edit", "delete"]) {
          if (modPerms[act] !== baseModPerms[act]) {
            hasDiff = true;
          }
        }
        if (hasDiff) {
          diffPerms[mod] = { ...modPerms };
        }
      }

      const res = await fetch(`${API_BASE_URL}/permissions/users/${activeUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editFirstName.trim(),
          lastName: editLastName.trim(),
          phone: editPhone.trim(),
          username: editUsername.trim(),
          email: editEmail.trim(),
          customPermissions: diffPerms,
          documentAccess: editDocAccess,
          password: editPassword || null,
          confirmPassword: confirmPassword || null,
        })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUsers((prev) => prev.map((u) => u.id === activeUser.id ? updatedUser : u));
        showToast("User details and overrides updated successfully!");
        window.dispatchEvent(new Event("permissions_updated"));
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
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl transition-all duration-300 border animate-bounce ${notification.type === "error"
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

      {/* Main card containing Creation panel */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 shadow-sm">
        {/* Page Header */}
        <div className="mb-10 pb-6 border-b border-slate-100">
          <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
            Users Management
          </h1>
        </div>

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
                  className={`px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${active
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

            {/* First Name (Dynamic based on Role) */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                First Name *
              </label>
              {(selectedRole || "").toUpperCase().includes("ADVOCATE") ? (
                <select
                  value={selectedAdvocateId}
                  onChange={(e) => {
                    const advId = e.target.value;
                    setSelectedAdvocateId(advId);
                    if (!advId) {
                      setFirstName("");
                      setLastName("");
                      setPhoneNumber("");
                      setEmailAddress("");
                      setUsername("");
                      setTempPassword("");
                      return;
                    }
                    const adv = advocates.find(a => a.id.toString() === advId);
                    if (adv) {
                      const nameParts = (adv.advocateName || adv.advocate_name || "").trim().split(" ");
                      setFirstName(nameParts[0] || "");
                      setLastName(nameParts.slice(1).join(" ") || "Advocate");
                      setPhoneNumber(adv.phoneNumber || adv.phone_number || "");
                      setEmailAddress(adv.emailAddress || adv.email_address || "");
                      const baseUsername = (adv.advocateName || adv.advocate_name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                      setUsername(baseUsername);
                      setTempPassword(adv.tempPassword || "");
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium cursor-pointer"
                  required
                >
                  <option value="">-- Select Advocate --</option>
                  {advocates.map((adv) => {
                    const advName = adv.advocateName || adv.advocate_name || "Unknown Advocate";
                    return (
                      <option key={adv.id} value={adv.id}>
                        {advName}
                      </option>
                    );
                  })}
                </select>
              ) : (selectedRole || "").toUpperCase().includes("CLIENT") ? (
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setSelectedClientId(cId);
                    if (!cId) {
                      setFirstName("");
                      setLastName("");
                      setPhoneNumber("");
                      setEmailAddress("");
                      setUsername("");
                      return;
                    }
                    const client = clients.find(c => c.id === cId);
                    if (client) {
                      const nameParts = (client.clientName || "").trim().split(" ");
                      setFirstName(nameParts[0] || "");
                      setLastName(nameParts.slice(1).join(" ") || "Client");
                      setPhoneNumber(client.contactNumber || "");
                      setEmailAddress(client.emailId || "");
                      const baseUsername = (client.clientName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                      setUsername(baseUsername);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium cursor-pointer"
                  required
                >
                  <option value="">-- Select Client --</option>
                  {clients.map((client) => {
                    const cName = client.clientName || "Unknown Client";
                    return (
                      <option key={client.id} value={client.id}>
                        {cName}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 placeholder:text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
                />
              )}
            </div>

            {/* Last Name */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 placeholder:text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
              />
            </div>

            {/* Phone Number */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Phone Number *
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
                required
                className={`w-full rounded-xl border px-4 py-3 text-slate-800 placeholder:text-slate-700 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm font-medium ${phoneNumber &&
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
                Temp Password *
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  required
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
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Active Provisioned Users
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {(() => {
                      const filteredUsers = filterRole === "All" ? users : users.filter(u => u.role === filterRole);
                      return `${filteredUsers.length} user${filteredUsers.length !== 1 ? "s" : ""} available`;
                    })()}
                  </p>
                </div>

                {/* Role Filter Dropdown */}
                <div>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#2563EB] outline-none transition-all text-sm font-bold cursor-pointer"
                  >
                    <option value="All">All Roles</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.name}>{role.name}</option>
                    ))}
                  </select>
                </div>
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
                  {(() => {
                    const filteredUsers = filterRole === "All" ? users : users.filter(u => u.role === filterRole);
                    if (filteredUsers.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-400 text-sm">
                            No users available
                          </td>
                        </tr>
                      );
                    }
                    return filteredUsers.map((user, idx) => {
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
                                  {(user.firstName || user.lastName)
                                    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                    : user.username}
                                </p>
                                <p className="text-xs text-slate-400">@{user.username}</p>
                                <p className="text-xs font-semibold text-blue-600 mt-0.5">{user.role}</p>
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
                    });
                  })()}
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

                      {activeUser?.tempPassword && (
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Key size={12} />
                          <span>Temp Pwd: <strong className="text-white select-all">{activeUser.tempPassword}</strong></span>
                        </div>
                      )}
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
                        className={`flex items-center gap-2 py-4 px-5 text-xs font-bold uppercase border-b-2 whitespace-nowrap ${modalTab === tab.key
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
                  <div className={`max-h-[60vh] bg-slate-50 ${modalTab === "permissions" ? "overflow-hidden" : "overflow-y-auto"}`}>

                    {/* Profile */}
                    {modalTab === "profile" && (
                      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          ["First Name", editFirstName, setEditFirstName],
                          ["Last Name", editLastName, setEditLastName],
                          ["Phone Number", editPhone, setEditPhone],
                          ["Username", editUsername, setEditUsername],
                          ["Email Address", editEmail, setEditEmail],
                        ].map(([label, value, setter]) => (

                          <div key={label}>
                            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest mb-2 block">
                              {label}
                            </label>
                            <input
                              value={value}
                              onChange={(e) => setter(e.target.value)}
                              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3.5 text-[#0F172A] placeholder:text-[#94A3B8] focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-[#2563EB] outline-none transition-all text-sm font-medium"
                            />
                          </div>
                        ))}
                        <div>
                          <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest mb-2 block">
                            New Password (Optional)
                          </label>

                          <input
                            type="password"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            placeholder="Leave blank to keep current password"
                            className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3.5"
                          />
                          {activeUser?.tempPassword && (
                            <p className="mt-1.5 text-xs text-slate-500 font-medium">
                              Current Temporary Password: <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded font-bold select-all">{activeUser.tempPassword}</code>
                            </p>
                          )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest mb-2 block">
                            Confirm Password
                          </label>

                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3.5"
                          />
                        </div>

                      </div>
                    )}

                    {/* Permissions */}
                    {modalTab === "permissions" && (
                      <div className="p-8">
                        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl shadow-slate-200/40 overflow-auto max-h-[50vh]">
                          <table className="w-full border-collapse text-left">
                            <thead>
                              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                <th className="sticky top-0 z-20 bg-[#F8FAFC] py-4 px-6 text-xs font-bold text-[#64748B] uppercase tracking-widest">Module</th>
                                {ACTIONS.map((act) => (
                                  <th key={act} className="sticky top-0 z-20 bg-[#F8FAFC] py-4 px-6 text-xs font-bold text-[#64748B] uppercase tracking-widest text-center w-28">
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
                                      className="py-3 px-6 font-bold text-[11px] uppercase tracking-[0.2em] text-[#64748B] bg-gradient-to-r from-[#F8FAFC] to-white border-y border-[#E2E8F0] border-l-4 border-l-[#2563EB]"
                                    >
                                      {cat.category}
                                    </td>
                                  </tr>
                                  {/* Modules Rows */}
                                  {cat.modules.map(({ key, label }) => {
                                    const perms = editCustomPerms[key] || {};
                                    return (
                                      <tr key={key} className="hover:bg-[#F8FAFC] transition-colors duration-200 border-b border-[#F1F5F9] group/row">
                                        <td className="py-4 px-6 font-semibold text-[#1E293B] text-sm pl-8 flex items-center gap-3">
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] group-hover/row:bg-[#2563EB] transition-colors" />
                                          {label}
                                        </td>

                                        {ACTIONS.map((action) => (
                                          <td key={action} className="text-center py-4">
                                            <label className="relative inline-flex items-center justify-center cursor-pointer group/check">
                                              <input
                                                type="checkbox"
                                                checked={perms[action] || false}
                                                onChange={() => handleCustomPermissionToggle(key, action)}
                                                className="peer sr-only"
                                              />
                                              <div className={`w-5 h-5 rounded-[6px] flex items-center justify-center transition-all duration-200 border 
                                          ${perms[action]
                                                  ? "bg-[#2563EB] border-[#2563EB] shadow-sm shadow-blue-500/30"
                                                  : "bg-white border-[#CBD5E1] group-hover/check:border-[#2563EB]"}
                                        `}>
                                                {perms[action] && <Check size={13} className="text-white stroke-[3.5]" />}
                                              </div>
                                            </label>
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
                  <div className="px-8 py-6 border-t border-[#E2E8F0] bg-white flex justify-end gap-4 rounded-b-3xl">
                    <button
                      onClick={() => setIsDetailsOpen(false)}
                      className="px-8 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#475569] text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleSaveModal}
                      className="px-8 py-3.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
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
                onClick={() => { setDeleteTarget(null); setDeleteImpact(null); }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200"
                >
                  {/* Header / Warning Icon */}
                  <div className="bg-red-50 py-7 px-6 flex flex-col items-center border-b border-slate-100 text-center">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-red-200 animate-pulse">
                      <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-slate-900 font-extrabold text-2xl">
                      Delete {getRoleDisplayName(deleteTarget.role)} Account?
                    </h3>
                    <p className="text-slate-500 text-xs mt-1.5 font-medium max-w-xs">
                      Remove <strong className="text-red-600">@{deleteTarget.username}</strong>? This action cannot be undone.
                    </p>
                  </div>

                  {/* Impact Warning Section */}
                  {impactLoading ? (
                    <div className="px-6 py-5 flex items-center justify-center gap-2 text-slate-500 text-sm">
                      <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      <span>Checking active cases...</span>
                    </div>
                  ) : deleteImpact && deleteImpact.has_impact ? (
                    <div className="px-6 py-5 border-b border-slate-100">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle size={13} className="text-amber-600" />
                        </div>
                        <p className="text-amber-700 font-bold text-sm">
                          {deleteImpact.total} active {deleteImpact.total === 1 ? "case" : "cases"} still in progress
                        </p>
                      </div>
                      <p className="text-slate-500 text-xs mb-3">
                        These cases will remain but the advocate / client assignment will be cleared:
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {[...( deleteImpact.assigned_cases || []).map(c => ({
                          name: c.case_name,
                          number: c.case_number,
                          status: c.status,
                          sub: c.client_name || c.advocate_name
                        })), ...(deleteImpact.cases || []).map(c => ({
                          name: c.title,
                          number: c.case_no,
                          status: c.status,
                          sub: c.client_name
                        }))].map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-amber-200 flex items-center justify-center flex-shrink-0">
                                <FileText size={13} className="text-amber-700" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                                <p className="text-[10px] text-slate-500 truncate">{item.number}{item.sub ? ` · ${item.sub}` : ""}</p>
                              </div>
                            </div>
                            <span className="ml-2 flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                              {item.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : deleteImpact && !deleteImpact.has_impact ? (
                    <div className="px-6 py-4 border-b border-slate-100">
                      <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                        <Check size={15} className="text-emerald-600 flex-shrink-0" />
                        <p className="text-xs font-semibold">No active cases linked to this user.</p>
                      </div>
                    </div>
                  ) : null}

                  {/* Action Buttons */}
                  <div className="px-6 py-5 bg-slate-50 flex flex-col sm:flex-row gap-3 justify-end">
                    <button
                      onClick={() => { setDeleteTarget(null); setDeleteImpact(null); }}
                      className="px-6 py-3 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      disabled={impactLoading}
                      className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      {deleteImpact && deleteImpact.has_impact ? "Confirm Delete" : `Delete ${getRoleDisplayName(deleteTarget.role)}`}
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
