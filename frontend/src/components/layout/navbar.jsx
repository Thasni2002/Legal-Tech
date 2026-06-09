"use client";

import { useState } from "react";

export default function Navbar() {
  const [showProfile, setShowProfile] = useState(false);

  return (
   <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-end px-4 md:px-6 text-black">

  {/* Right Side */}
  <div className="flex items-center gap-4 md:gap-6">

    {/* Notifications */}
    <button className="px-4 py-2 rounded-lg text-black font-bold hover:bg-gray-100 transition duration-200">
      Notifications
    </button>

    {/* Profile */}
    <div className="relative">
      <button
        className="px-4 py-2 rounded-lg text-black font-bold hover:bg-gray-100 transition duration-200"
      >
        Profile
      </button>
    </div>

  </div>

</header>
  );
}