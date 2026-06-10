"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientEdit() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    clientId: "",
    fullName: "",
    email: "",
    phone: "",
    courtName: "",
  });

  useEffect(() => {
    const data = localStorage.getItem("clientData");

    if (data) {
      setFormData(JSON.parse(data));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = () => {
    localStorage.setItem(
      "clientData",
      JSON.stringify(formData)
    );

    alert("Client Updated");

    router.push("/client-management/view-client");
  };

  return (
    <div className="p-8">
      <div className="bg-white p-6 rounded shadow">

        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          className="border p-3 rounded w-full mb-3"
        />

        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="border p-3 rounded w-full mb-3"
        />

        <button
          onClick={handleUpdate}
          className="bg-green-600 text-white px-6 py-3 rounded"
        >
          Update Client
        </button>
      </div>
    </div>
  );
}