"use client";

import ProfileManagement from '@/pages/UI/ProfileManagement/ProfileManagmentView'
import ProfileView from "@/pages/UI/ProfileManagement/profileView";
import React, { useState, useEffect } from 'react'

const Page = () => {
  const [profile, setProfile] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedProfile = localStorage.getItem("advocate_profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        setIsSubmitted(true);
      } catch (e) {
        console.error("Error parsing saved profile data:", e);
      }
    }
    setIsLoading(false);
  }, []);

  const handleSave = (updatedProfile) => {
    localStorage.setItem("advocate_profile", JSON.stringify(updatedProfile));
    setProfile(updatedProfile);
    setIsSubmitted(true);
  };

  const handleCancel = () => {
    if (profile) {
      setIsSubmitted(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-gray-500 font-medium animate-pulse">
          Loading Profile...
        </div>
      </div>
    );
  }

  return (
    <div>
      {isSubmitted ? (
        <ProfileView profile={profile} onEdit={() => setIsSubmitted(false)} />
      ) : (
        <ProfileManagement
          initialData={profile}
          onSubmit={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}

export default Page
