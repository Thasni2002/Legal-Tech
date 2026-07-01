"use client";

import Link from "next/link";
import Image from "next/image";

export default function FloatingAIIcon() {
  return (
    <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100]">
      <Link href="/document-generation" aria-label="Document Generation">
        <div className="relative group flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-[3px] border-[#3B82F6] hover:scale-110 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          
          <Image
            src="/image.png"
            alt="AI Document Generation"
            width={40}
            height={40}
            className="object-contain"
          />
          
          {/* Subtle Ping Animation behind the icon to draw attention */}
          <span className="absolute inset-0 rounded-full bg-[#2563EB] opacity-0 group-hover:opacity-30 group-hover:animate-ping -z-10"></span>
          
          {/* Tooltip */}
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-2 bg-[#0F172A] text-white text-sm font-medium rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none">
            Document Generation
            {/* Tooltip Arrow */}
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 border-4 border-transparent border-l-[#0F172A]"></div>
          </div>
        </div>
      </Link>
    </div>
  );
}
