"use client";
import { API_BASE_URL } from "@/utils/api";

import ProfileManagement from '@/pages/UI/ProfileManagement/ProfileManagmentView'
import ProfileView from "@/pages/UI/ProfileManagement/profileView";
import React, { useState, useEffect } from 'react'
import { getLoggedInUser } from "@/utils/auth";

const Page = () => {
  const [profile, setProfile] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = getLoggedInUser();
        if (!user || !user.email) {
          setIsLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/lawfirm-management/`);
        if (res.ok) {
          const advocates = await res.json();
          const myAdvocate = advocates.find(
            (adv) => adv.emailAddress === user.email
          );
          if (myAdvocate) {
            setProfile(myAdvocate);
            localStorage.setItem("advocate_profile", JSON.stringify(myAdvocate));
            setIsSubmitted(true);
          } else {
            // Profile not found in advocates table, pre-fill with user details
            setProfile({
              advocateName: user.username,
              emailAddress: user.email,
            });
          }
        }
      } catch (e) {
        console.error("Error fetching profile from backend:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async (updatedProfile) => {
    try {
      const payload = { ...updatedProfile };
      
      // Clean empty strings for Pydantic validation
      if (payload.dateOfBirth === "") {
        payload.dateOfBirth = null;
      }
      if (payload.yearsOfExperience === "") {
        payload.yearsOfExperience = null;
      }

      let response;
      if (payload.id) {
        response = await fetch(`${API_BASE_URL}/lawfirm-management/${payload.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/lawfirm-management/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        const savedData = await response.json();
        setProfile(savedData);
        localStorage.setItem("advocate_profile", JSON.stringify(savedData));
        setIsSubmitted(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.detail || "Failed to save profile to backend.");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile.");
    }
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
