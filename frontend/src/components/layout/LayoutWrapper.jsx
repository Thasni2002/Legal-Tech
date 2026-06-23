"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import { getLoggedInUser } from "@/utils/auth";

// Pages that should NOT show the sidebar/navbar
const AUTH_ROUTES = ["/login", "/register"];

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = AUTH_ROUTES.includes(pathname);

  // shared collapse state for sidebar & main content
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isVerified, setIsVerified] = useState(isAuthPage);

  useEffect(() => {
    if (isAuthPage) {
      setIsVerified(true);
      return;
    }

    const verifyUser = () => {
      const loggedIn = getLoggedInUser();
      if (!loggedIn) {
        setIsVerified(false);
        localStorage.removeItem("token");
        router.push("/login");
        return;
      } else {
        setIsVerified(true);
      }

      fetch(`http://localhost:8000/permissions/users/${loggedIn.id}`)
        .then((res) => {
          if (res.status === 404 || res.status === 401) {
            setIsVerified(false);
            localStorage.removeItem("token");
            router.push("/login");
          } else {
            setIsVerified(true);
          }
        })
        .catch((err) => {
          console.error("Failed to verify user status:", err);
        });
    };

    // Run verification on mount/navigation
    verifyUser();

    // Run verification periodically (every 10 seconds)
    const interval = setInterval(verifyUser, 10000);

    return () => clearInterval(interval);
  }, [pathname, isAuthPage, router]);

  // Auth pages render standalone — no sidebar or navbar
  if (isAuthPage) {
    return <>{children}</>;
  }

  // If not verified, return blank container so they can't see anything
  if (!isVerified) {
    return <div className="min-h-screen bg-[#F8FAFC]" />;
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col  ${isCollapsed ? "md:pl-20" : "md:pl-64 "} min-h-screen`}>
        <Navbar />
        <main className="flex-1 p-4 md:p-6 lg:p-12">{children}</main>
      </div>
    </div>
  );
}
