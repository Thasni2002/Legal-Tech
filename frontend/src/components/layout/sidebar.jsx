import { useState, useEffect } from "react";
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
  ChevronDown,
  ChevronUp,
  Shield,
} from "lucide-react";
import Image from "next/image";
// Map original section titles to new header labels
const sectionTitleMap = {
  "Advocate Section": "Advocate Section",
  "Junior Advocate": "Junior Advocate",
  "Client Section": "Client Section",
  "User Roles": "SYSTEM",
};

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false); // mobile overlay
  const [userRolesOpen, setUserRolesOpen] = useState(() =>
    pathname?.startsWith("/permissions") || false
  );
  const [user, setUser] = useState(null);
  const [customPermissions, setCustomPermissions] = useState({});
  const [rolePermissions, setRolePermissions] = useState({});

  useEffect(() => {
    const loggedIn = getLoggedInUser();
    setUser(loggedIn);
    setIsOpen(false);
    if (pathname?.startsWith("/permissions")) {
      setUserRolesOpen(true);
    }

    if (loggedIn && loggedIn.id) {
      // Fetch details including customPermissions
      fetch(`http://localhost:8000/permissions/users/${loggedIn.id}`)
        .then((res) => res.json())
        .then((data) => {
          setCustomPermissions(data.customPermissions || {});
        })
        .catch((err) => {
          console.error("Error fetching user permissions:", err);
        });

      // Fetch permissions matrix
      fetch("http://localhost:8000/permissions")
        .then((res) => res.json())
        .then((matrix) => {
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
          console.error("Error fetching permissions matrix:", err);
        });
    }
  }, [pathname]);

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

    return true;
  };

  // Define the menu structure (icon + label + moduleKey)
  const seniorMenu = [
    {
      title: "Advocate Section",
      items: [
        { name: "Dashboard", path: "/", icon: Home, moduleKey: "Dashboard" },
        { name: "Case Management", path: "/case-management", icon: Folder, moduleKey: "Case Management" },
        { name: "Client Management", path: "/client-management", icon: Users, moduleKey: "Client Management" },
        { name: "Law Firm Management", path: "/lawfirm-management", icon: Scale, moduleKey: "Law Firm Management" },
        { name: "Case Discussion", path: "/consultations", icon: BookOpen, moduleKey: "Consultations" },
        { name: "Finance Management", path: "/finance-management", icon: CreditCard, moduleKey: "Finance Management" },
        { name: "Calendar", path: "/calendar", icon: Calendar, moduleKey: "Calendar" },
      ],
    },
  ];

  const juniorMenu = [
    {
      title: "Junior Advocate",
      items: [
        { name: "Dashboard", path: "/junior-dashboard", icon: Home, moduleKey: "Dashboard" },
        { name: "Assigned Cases", path: "/assigned-cases", icon: Folder, moduleKey: "Assigned Cases" },
        { name: "Calendar", path: "/junior-calendar", icon: Calendar, moduleKey: "Calendar" },
      ],
    },
  ];

  const clientMenu = [
    {
      title: "Client Section",
      items: [
        { name: "Dashboard", path: "/client-dashboard", icon: Home, moduleKey: "Dashboard" },
        { name: "Case Discussion", path: "/client-consultation", icon: BookOpen, moduleKey: "Consultation" },
        { name: "Case Tracking", path: "/client-case-tracking", icon: Folder, moduleKey: "Case Tracking" },
        { name: "Documents", path: "/client-documents", icon: Settings, moduleKey: "Documents" },
        { name: "Payments", path: "/client-payments", icon: CreditCard, moduleKey: "Payments" },
      ],
    },
  ];

  let filteredMenuItems = [];
  if (user) {
    const roleName = (user.role || "").toLowerCase().replace(/\s+/g, "");
    let baseMenu = [];
    if (roleName === "client") {
      baseMenu = clientMenu;
    } else if (roleName === "junioradvocate") {
      baseMenu = juniorMenu;
    } else {
      baseMenu = [
        ...seniorMenu,
        {
          title: "User Roles",
          items: [
            {
              name: "User Roles",
              isDropdown: true,
              icon: Shield,
              submenu: [
                { name: "Roles", path: "/permissions/roles", moduleKey: "Roles" },
                { name: "Users", path: "/permissions/users", moduleKey: "Users" },
                { name: "Permissions", path: "/permissions", moduleKey: "Permissions" },
              ],
            },
          ],
        },
      ];
    }

    // Filter menu items by view permissions
    filteredMenuItems = baseMenu.map((section) => {
      const filteredItems = section.items
        .map((item) => {
          if (item.isDropdown) {
            const filteredSubmenu = item.submenu.filter((sub) =>
              hasViewPermission(sub.moduleKey)
            );
            if (filteredSubmenu.length === 0) return null;
            return { ...item, submenu: filteredSubmenu };
          }
          if (!hasViewPermission(item.moduleKey)) return null;
          return item;
        })
        .filter(Boolean);

      return { ...section, items: filteredItems };
    }).filter((section) => section.items.length > 0);
  }

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 left-3 z-[60] flex items-center justify-center w-10 h-10 bg-[#0F172A] text-white rounded-lg shadow-lg md:hidden transition-colors duration-200"
      >
        {isOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen transition-[width] duration-300 ease-in-out bg-white border-r border-[#E2E8F0] z-50 ${isCollapsed ? "w-[72px]" : "w-[280px]"
          } ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Logo & Collapse Toggle */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Scale size={22} className="text-[#2563EB]" />
              <h2 className={`text-xl font-bold tracking-tight ${isCollapsed ? "hidden" : "block"} text-[#0F172A]`}>LEGAL-TECH</h2>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded hover:bg-[#F1F5F9] transition-colors"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight size={20} className="text-[#64748B]" />
              ) : (
                <ChevronLeft size={20} className="text-[#64748B]" />
              )}
            </button>
          </div>


          <nav className="flex-1 px-4 py-5">
            {filteredMenuItems.map((section) => (
              <div key={section.title} className="mb-5">
                {/* Section Header */}
                {!isCollapsed && (
                  <h3 className="px-3 mb-2 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest">
                    {sectionTitleMap[section.title] || section.title}
                  </h3>
                )}
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    if (item.isDropdown) {
                      const active = userRolesOpen;
                      return (
                        <li key={item.name}>
                          <button
                            onClick={() => setUserRolesOpen(!userRolesOpen)}
                            className="flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-[#1E293B] hover:bg-[#F8FAFC] transition-colors duration-200"
                          >
                            <div className="flex items-center gap-2.5">
                              <item.icon size={17} className="text-[#64748B]" />
                              {!isCollapsed && <span>{item.name}</span>}
                            </div>
                            {userRolesOpen ? (
                              <ChevronUp size={15} className="text-[#94A3B8]" />
                            ) : (
                              <ChevronDown size={15} className="text-[#94A3B8]" />
                            )}
                          </button>
                          {userRolesOpen && (
                            <ul className="pl-4 mt-1 ml-4 border-l-2 border-[#2563EB]/20 space-y-0.5">
                              {item.submenu.map((sub) => (
                                <li key={sub.path}>
                                  <Link
                                    href={sub.path}
                                    className={`block px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${pathname === sub.path
                                        ? "text-[#2563EB] bg-[#2563EB]/5 font-medium"
                                        : "text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]"
                                      }`}
                                  >
                                    {sub.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    }

                    const active = pathname === item.path || pathname.startsWith(item.path + "/");
                    const IconComponent = item.icon;
                    return (
                      <li key={item.path} className="relative group">
                        <Link
                          href={item.path}
                          title={isCollapsed ? item.name : undefined}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${active
                              ? "bg-[rgba(37,99,235,0.12)] border-l-4 border-[#2563EB] text-[#2563EB] font-semibold"
                              : "text-[#1E293B] hover:bg-[#F8FAFC]"
                            }`}
                        >
                          <IconComponent size={17} className="flex-shrink-0" />
                          {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                        {isCollapsed && (
                          <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-[#0F172A] text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                            {item.name}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          {/* User Profile */}
          <Link
            href="/profile-management"
            className="px-6 py-5 border-t border-[#E2E8F0] flex items-center hover:bg-[#F8FAFC] transition"
          >
            <Image
              src="https://i.pravatar.cc/150?img=12"
              alt="Profile"
              width={36}
              height={36}
              className="rounded-full object-cover ring-2 ring-[#E2E8F0]"
            />

            {!isCollapsed && (
              <div className="ml-3 text-left">
                <h4 className="font-semibold text-sm text-[#0F172A] capitalize">
                  {user ? user.username : "Guest User"}
                </h4>
                <p className="text-xs text-[#64748B]">
                  {user ? user.role : "Viewer"}
                </p>
              </div>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
}