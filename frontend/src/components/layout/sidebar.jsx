import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { getLoggedInUser } from "@/utils/auth";
import {
  Home,
  Scale,
  Folder,
  Users,
  Calendar,
  CreditCard,
  BookOpen,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  ClipboardList,
  FileText,
  Key,
  Briefcase,
  Layers,
} from "lucide-react";
import { API_BASE_URL } from "@/utils/api";

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false); // Mobile drawer overlay state
  const [activeModuleId, setActiveModuleId] = useState("advocate");
  const [user, setUser] = useState(null);
  const [customPermissions, setCustomPermissions] = useState({});
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);

  const fetchPermissions = () => {
    const loggedIn = getLoggedInUser();
    if (loggedIn && loggedIn.id) {
      Promise.all([
        fetch(`${API_BASE_URL}/permissions/users/${loggedIn.id}`)
          .then((res) => (res.status === 200 ? res.json() : { customPermissions: {} }))
          .catch(() => ({ customPermissions: {} })),
        fetch(`${API_BASE_URL}/permissions`)
          .then((res) => (res.status === 200 ? res.json() : {}))
          .catch(() => ({})),
      ])
        .then(([userData, matrix]) => {
          setCustomPermissions(userData.customPermissions || {});

          const roleKey = Object.keys(matrix).find(
            (k) =>
              k.toLowerCase().replace(/\s+/g, "") ===
              (loggedIn.role || "").toLowerCase().replace(/\s+/g, "")
          );
          if (roleKey) {
            setRolePermissions(matrix[roleKey] || {});
          } else {
            setRolePermissions(matrix[loggedIn.role] || {});
          }
        })
        .catch((err) => {
          console.warn("Sidebar: could not load permissions —", err?.message || err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loggedIn = getLoggedInUser();
    setUser(loggedIn);
    setIsOpen(false);

    const savedProfile = localStorage.getItem("advocate_profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.profileImage) {
          setProfileImage(parsed.profileImage);
        }
      } catch (e) {}
    }

    fetchPermissions();
  }, [pathname]);

  useEffect(() => {
    window.addEventListener("permissions_updated", fetchPermissions);
    return () => window.removeEventListener("permissions_updated", fetchPermissions);
  }, []);

  const hasViewPermission = (moduleKey) => {
    if (!moduleKey) return true;

    // Check custom permissions (direct permissions) first
    if (customPermissions && customPermissions[moduleKey] !== undefined) {
      if (customPermissions[moduleKey].view !== undefined) {
        return !!customPermissions[moduleKey].view;
      }
    }

    // Check role permissions next
    if (rolePermissions && rolePermissions[moduleKey] !== undefined) {
      return !!rolePermissions[moduleKey].view;
    }

    // Default fallback for Clerk and Senior Advocate roles so new modules are visible by default
    const userRoleStr = (user?.role || "").toLowerCase().replace(/\s+/g, "");
    if (userRoleStr.includes("clerk") || userRoleStr.includes("senior")) {
      return true;
    }

    return false; // fallback — hide item if no permission rule is found
  };

  // Define 2-Tier Modules with sub-items
  const modules = useMemo(() => [
    {
      id: "advocate",
      title: "Advocate Section",
      shortLabel: "Admin",
      icon: Scale,
      items: [
        { name: "Dashboard", path: "/", icon: Home, moduleKey: "Dashboard" },
        { name: "Case Management", path: "/case-management", icon: Folder, moduleKey: "Case Management" },
        { name: "Client Management", path: "/client-management", icon: Users, moduleKey: "Client Management" },
        { name: "Law Firm Management", path: "/lawfirm-management", icon: Scale, moduleKey: "Law Firm Management" },
        { name: "Case Discussion", path: "/consultations", icon: BookOpen, moduleKey: "Consultations" },
        { name: "Billing", path: "/finance-management", icon: CreditCard, moduleKey: "Finance Management" },
        { name: "Calendar", path: "/calendar", icon: Calendar, moduleKey: "Calendar" },
        { name: "eCourts Services", path: "/ecourts", icon: Scale, moduleKey: "eCourts Integration" },
        { name: "Assigned Tasks", path: "/assigned-tasks", icon: ClipboardList, moduleKey: "Assigned Tasks" },
        { name: "Leave Management", path: "/leave-management", icon: Calendar, moduleKey: "Leave Management" },
      ],
    },
    {
      id: "junior",
      title: "Junior Advocate",
      shortLabel: "Junior",
      icon: Briefcase,
      items: [
        { name: "Dashboard", path: "/junior-dashboard", icon: Home, moduleKey: "Junior Dashboard" },
        { name: "Assigned Cases", path: "/assigned-cases", icon: Folder, moduleKey: "Assigned Cases" },
        { name: "Assigned Tasks", path: "/junior-assigned-tasks", icon: ClipboardList, moduleKey: "Junior Assigned Tasks" },
        { name: "Calendar", path: "/junior-calendar", icon: Calendar, moduleKey: "Junior Calendar" },
        { name: "Leave", path: "/junior-leave", icon: Calendar, moduleKey: "Junior Leave" },
      ],
    },
    {
      id: "clerk",
      title: "Clerk Section",
      shortLabel: "Clerk",
      icon: ClipboardList,
      items: [
        { name: "Dashboard", path: "/clerk/dashboard", icon: Home, moduleKey: "Clerk Dashboard" },
        { name: "Court Visit", path: "/clerk/court-visit", icon: Scale, moduleKey: "Court Visit" },
        { name: "Format Physical File", path: "/clerk/format-physical-file", icon: Folder, moduleKey: "Format Physical File" },
        { name: "Leave", path: "/clerk/leave", icon: Calendar, moduleKey: "Clerk Leave" },
      ],
    },
    {
      id: "client",
      title: "Client Section",
      shortLabel: "Client",
      icon: Users,
      items: [
        { name: "Dashboard", path: "/client-dashboard", icon: Home, moduleKey: "Client Dashboard" },
        { name: "Case Discussion", path: "/client-consultation", icon: BookOpen, moduleKey: "Consultation" },
        { name: "Case Tracking", path: "/client-case-tracking", icon: Folder, moduleKey: "Case Tracking" },
        { name: "Document Format", path: "/client-document-format-generate", icon: FileText, moduleKey: "Client Document Generate" },
        { name: "Documents", path: "/client-documents", icon: Settings, moduleKey: "Documents" },
        { name: "Payments", path: "/client-payments", icon: CreditCard, moduleKey: "Payments" },
      ],
    },
    {
      id: "system",
      title: "System & Roles",
      shortLabel: "Permissions",
      icon: Shield,
      items: [
        { name: "Roles Matrix", path: "/permissions/roles", icon: Shield, moduleKey: "Roles" },
        { name: "Users Clearance", path: "/permissions/users", icon: Users, moduleKey: "Users" },
        { name: "Permissions Config", path: "/permissions", icon: Key, moduleKey: "Permissions" },
      ],
    },
  ], []);

  // Filter items based on permissions
  const filteredModules = useMemo(() => {
    return modules
      .map((mod) => {
        const allowedItems = mod.items.filter((item) => hasViewPermission(item.moduleKey));
        return { ...mod, items: allowedItems };
      })
      .filter((mod) => mod.items.length > 0);
  }, [modules, customPermissions, rolePermissions, user]);

  // Auto-detect current active module based on URL pathname
  useEffect(() => {
    if (!pathname) return;
    for (const mod of filteredModules) {
      const match = mod.items.some(
        (item) => item.path === pathname || (item.path !== "/" && pathname.startsWith(item.path))
      );
      if (match) {
        setActiveModuleId(mod.id);
        break;
      }
    }
  }, [pathname, filteredModules]);

  const activeModule = filteredModules.find((m) => m.id === activeModuleId) || filteredModules[0];

  const handleModuleClick = (modId) => {
    setActiveModuleId(modId);
    if (isCollapsed) {
      setIsCollapsed(false); // Expand secondary drawer when module is clicked
    }
  };

  if (loading) {
    return (
      <aside className="fixed top-0 left-0 h-screen bg-[#0F172A] border-r border-slate-800 z-50 w-[72px] flex items-center justify-center">
        <span className="animate-pulse text-xs text-blue-400">...</span>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Hamburger Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 left-3 z-[60] flex items-center justify-center w-10 h-10 bg-[#0F172A] text-white rounded-lg shadow-lg md:hidden transition-colors duration-200"
        aria-label="Toggle Navigation"
      >
        {isOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
      </button>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Container for 2-Tier Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen z-50 flex transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Tier 1: Primary Icon Rail (Width 72px) */}
        <aside className="w-[72px] h-screen bg-[#0F172A] text-slate-300 flex flex-col justify-between items-center py-4 border-r border-slate-800 flex-shrink-0 z-20 select-none">
          {/* Logo Mark */}
          <div className="flex flex-col items-center gap-1 mb-4">
            <Link
              href="/"
              className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
              title="LegalTech ERP"
            >
              <Scale size={24} />
            </Link>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">MB</span>
          </div>

          {/* Module Icons Navigation */}
          <nav className="flex-1 flex flex-col gap-3 items-center w-full px-2 overflow-y-auto no-scrollbar py-2">
            {filteredModules.map((mod) => {
              const isActive = activeModuleId === mod.id;
              const IconComp = mod.icon;
              return (
                <button
                  key={mod.id}
                  onClick={() => handleModuleClick(mod.id)}
                  className={`group relative w-12 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                  }`}
                  title={mod.title}
                >
                  <IconComp size={20} className={isActive ? "text-white" : "group-hover:scale-110 transition-transform"} />
                  <span className="text-[10px] font-medium tracking-tight mt-1 truncate max-w-full">
                    {mod.shortLabel}
                  </span>

                  {/* Active Indicator Bar on left edge */}
                  {isActive && (
                    <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile Avatar at Bottom */}
          <div className="pt-2 border-t border-slate-800/80 w-full flex flex-col items-center">
            <Link
              href="/profile-management"
              className="group relative p-1 rounded-full hover:ring-2 hover:ring-blue-500 transition-all"
              title={user ? `${user.username} (${user.role})` : "Profile"}
            >
              {user ? (
                <img
                  src={
                    profileImage ||
                    `https://ui-avatars.com/api/?name=${user.firstName || user.username}&background=2563EB&color=fff&rounded=true&bold=true&size=150`
                  }
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-700 group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
                  ?
                </div>
              )}
            </Link>
          </div>
        </aside>

        {/* Tier 2: Secondary Expandable Drawer (Width 220px) */}
        <aside
          className={`h-screen bg-white border-r border-[#E2E8F0] shadow-sm flex flex-col transition-all duration-300 ease-in-out overflow-hidden z-10 ${
            isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-[220px] opacity-100"
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] bg-slate-50/50">
            <div className="flex flex-col min-w-0">
              <h3 className="text-sm font-bold text-[#0F172A] truncate tracking-tight">
                {activeModule?.title || "Workspace"}
              </h3>
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                MODULE FEATURES
              </span>
            </div>

            {/* Collapse Toggle Button */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-lg bg-slate-200/70 hover:bg-slate-300 text-slate-600 hover:text-slate-900 transition-colors"
              title="Collapse sub-menu"
              aria-label="Collapse sub-menu"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* Drawer Links List */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
            {activeModule?.items.map((item) => {
              const isPathActive =
                pathname === item.path || (item.path !== "/" && pathname?.startsWith(item.path));
              const SubIcon = item.icon;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isPathActive
                      ? "bg-slate-100 text-blue-600 font-bold border-l-4 border-blue-600 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <SubIcon
                    size={16}
                    className={isPathActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Drawer Footer Status */}
          {user && (
            <div className="p-3 border-t border-[#E2E8F0] bg-slate-50/60">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-medium truncate max-w-[130px]">{user.username}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-semibold border border-blue-100 capitalize">
                  {user.role}
                </span>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Expand Button Floating Trigger when Collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed bottom-6 left-[84px] z-40 hidden md:flex items-center gap-1.5 px-3 py-2 bg-[#0F172A] text-white text-xs font-semibold rounded-full shadow-xl hover:bg-blue-600 transition-all border border-slate-700"
          title="Expand sub-menu"
        >
          <Layers size={14} />
          <span>{activeModule?.shortLabel || "Menu"}</span>
          <ChevronRight size={14} />
        </button>
      )}
    </>
  );
}