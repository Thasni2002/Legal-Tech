"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { FileText, Bot } from "lucide-react";
import { getLoggedInUser } from "@/utils/auth";
import { usePathname } from "next/navigation";

export default function FloatingAIIcon() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isClientUser, setIsClientUser] = useState(false);
  const [aiAssistantHref, setAiAssistantHref] = useState("/ai-assistant");
  
  // Position offset relative to initial fixed placement
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const menuRef = useRef(null);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const hasDraggedRef = useRef(false);

  useEffect(() => {
    const user = getLoggedInUser();
    if (user && user.role && user.role.toLowerCase() === "client") {
      setIsClientUser(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      let href = "/ai-assistant";
      try {
        const data = localStorage.getItem("clientData");
        if (data && typeof window !== "undefined" && window.location.pathname.includes("/client-management")) {
          const client = JSON.parse(data);
          const name = client.fullName || client.clientName;
          if (name) {
            href = `/ai-assistant?clientName=${encodeURIComponent(name.trim())}`;
          }
        }
      } catch (e) {
        console.error(e);
      }
      setAiAssistantHref(href);
    }
  }, [isOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Drag handlers for mouse and touch
  const handlePointerDown = (e) => {
    if (e.type === "mousedown" && e.button !== 0) return;
    
    const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: position.x,
      initialY: position.y
    };
    hasDraggedRef.current = false;

    const handlePointerMove = (moveEvent) => {
      const moveX = moveEvent.type.startsWith("touch") ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const moveY = moveEvent.type.startsWith("touch") ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const deltaX = moveX - dragStartRef.current.startX;
      const deltaY = moveY - dragStartRef.current.startY;

      if (Math.hypot(deltaX, deltaY) > 4) {
        hasDraggedRef.current = true;
        setIsDragging(true);
      }

      if (hasDraggedRef.current) {
        setPosition({
          x: dragStartRef.current.initialX + deltaX,
          y: dragStartRef.current.initialY + deltaY
        });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);

      setTimeout(() => {
        setIsDragging(false);
      }, 50);
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove, { passive: false });
    window.addEventListener("touchend", handlePointerUp);
  };

  const handleButtonClick = (e) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setIsOpen((prev) => !prev);
  };

  if (isClientUser || pathname === "/ai-assistant") {
    return null;
  }

  return (
    <div 
      className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] touch-none select-none" 
      ref={menuRef}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: isDragging ? "none" : "transform 0.1s ease-out"
      }}
    >
      {/* Menu Options (Slide up when open) */}
      <div 
        className={`absolute bottom-[110%] right-0 flex flex-col gap-3 mb-2 transition-all duration-300 ${
          isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <Link 
          href="/document-generation" 
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#3B82F6] transition-colors whitespace-nowrap group"
        >
          <div className="w-8 h-8 rounded-full bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText size={16} />
          </div>
          <span className="text-[#0F172A] font-medium text-sm">Document Generation</span>
        </Link>
        
        <Link 
          href={aiAssistantHref} 
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#8B5CF6] transition-colors whitespace-nowrap group"
        >
          <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center group-hover:scale-110 transition-transform">
            <Bot size={16} />
          </div>
          <span className="text-[#0F172A] font-medium text-sm">AI Legal Assistant</span>
        </Link>
      </div>

      {/* Main Floating Button */}
      <button 
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onClick={handleButtonClick}
        aria-label="AI Tools"
        className={`relative group flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-[3px] border-[#3B82F6] hover:scale-105 focus:outline-none ${
          isDragging ? "cursor-grabbing shadow-2xl scale-105" : "cursor-grab hover:shadow-2xl"
        } transition-all duration-200`}
      >
        <Image
          src="/image.png"
          alt="AI Tools"
          width={40}
          height={40}
          className={`object-contain pointer-events-none transition-transform duration-300 ${isOpen ? "rotate-180 scale-90" : "rotate-0"}`}
        />
        
        {/* Subtle Ping Animation behind the icon to draw attention */}
        <span className="absolute inset-0 rounded-full bg-[#2563EB] opacity-0 group-hover:opacity-30 group-hover:animate-ping -z-10"></span>
        
        {/* Tooltip (Only show when menu is closed and not dragging) */}
        {!isOpen && !isDragging && (
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-2 bg-[#0F172A] text-white text-sm font-medium rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none">
            AI Tools (Drag to move)
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 border-4 border-transparent border-l-[#0F172A]"></div>
          </div>
        )}
      </button>
    </div>
  );
}
