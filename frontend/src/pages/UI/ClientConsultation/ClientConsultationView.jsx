"use client";

import { useState } from "react";

export default function ClientConsultationView() {
  const [showModal, setShowModal] = useState(false);

  const [appointments, setAppointments] = useState([
    {
      id: 1,
      advocate: "Adv. Rahul Sharma",
      date: "2026-06-22",
      time: "11:00 AM",
      type: "Video Consultation",
      status: "Rescheduled",
    },
  ]);

  const [history, setHistory] = useState([
    {
      id: 101,
      date: "2026-05-15",
      advocate: "Adv. Rahul Sharma",
      type: "Video Consultation",
      duration: "30 mins",
      summary: "Property dispute discussion",
    },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    advocate: "",
    date: "",
    time: "",
    type: "",
  });

  const [rescheduleId, setRescheduleId] = useState(null);

  const [successToast, setSuccessToast] = useState({ show: false, message: "" });

  const triggerSuccess = (message) => {
    setSuccessToast({ show: true, message });
    setTimeout(() => {
      setSuccessToast({ show: false, message: "" });
    }, 4000);
  };

  const handleBookAppointment = () => {
    if (
      !formData.name ||
      !formData.advocate ||
      !formData.date ||
      !formData.time ||
      !formData.type
    ) {
      alert("Please fill all fields");
      return;
    }

    const newAppointment = {
      id: Date.now(),
      advocate: formData.advocate,
      date: formData.date,
      time: formData.time,
      type: formData.type,
      status: "Scheduled",
    };

    setAppointments([...appointments, newAppointment]);
    triggerSuccess("booking successfully");

    setShowModal(false);

    setFormData({
      name: "",
      advocate: "",
      date: "",
      time: "",
      type: "",
    });
  };

  const handleReschedule = () => {
    setAppointments(
      appointments.map((item) =>
        item.id === rescheduleId
          ? {
              ...item,
              date: formData.date,
              time: formData.time,
              status: "Rescheduled",
            }
          : item
      )
    );

    setRescheduleId(null);
    setShowModal(false);
    triggerSuccess("booking successfully");

    setFormData({
      name: "",
      advocate: "",
      date: "",
      time: "",
      type: "",
    });
  };

  const handleApproveAppointment = (id) => {
    setAppointments(
      appointments.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "Approved",
            }
          : item
      )
    );
    triggerSuccess("booking successfully");
  };

  return (
    <div className="w-full space-y-6 md:space-y-8">

        {/* Page Header */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
            Consultations
          </h1>
          <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
            Book an appointment or join a consultation
          </p>
        </div>

        {/* Top Section */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left Side */}
          <div className="lg:col-span-2 space-y-6">

            {/* Cards */}
            <div className="grid md:grid-cols-2 gap-6">

              <div className="bg-white rounded-2xl border p-6">
                <h2 className="text-2xl font-semibold text-[#0F172A]">
                  Book Appointment
                </h2>

                <p className="text-[#64748B] mt-3">
                  Choose a date and time to meet your advocate.
                </p>

                <button
                  onClick={() => {
                    setRescheduleId(null);
                    setShowModal(true);
                  }}
                  className="mt-6 bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-6 py-3 rounded-xl"
                >
                  Book Appointment
                </button>
              </div>

              <div className="bg-white rounded-2xl border p-6">
                <h2 className="text-2xl font-semibold text-[#0F172A]">
                  Video Consultation
                </h2>

                <p className="text-[#64748B] mt-3">
                  Join a video consultation with your advocate.
                </p>

                <button className="mt-6 bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-6 py-3 rounded-xl">
                  Join Consultation
                </button>
              </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="text-xl font-semibold mb-6">
                Consultation History
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F8FAFC]">
                      <th className="p-3 text-left">
                        Date
                      </th>
                      <th className="p-3 text-left">
                        Advocate
                      </th>
                      <th className="p-3 text-left">
                        Type
                      </th>
                      <th className="p-3 text-left">
                        Duration
                      </th>
                      <th className="p-3 text-left">
                        Summary
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b"
                      >
                        <td className="p-3">
                          {item.date}
                        </td>

                        <td className="p-3">
                          {item.advocate}
                        </td>

                        <td className="p-3">
                          {item.type}
                        </td>

                        <td className="p-3">
                          {item.duration}
                        </td>

                        <td className="p-3">
                          {item.summary}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Upcoming Consultations */}
          <div className="bg-white rounded-2xl border p-6 h-fit">
            <h2 className="text-xl font-semibold mb-6">
              Upcoming Consultations
            </h2>

            <div className="space-y-4">
              {appointments.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-xl p-4"
                >
                  <h3 className="font-semibold">
                    {item.advocate}
                  </h3>

                  <p className="text-sm text-[#64748B] mt-2">
                    {item.date}
                  </p>

                  <p className="text-sm text-[#64748B]">
                    {item.time}
                  </p>

                  <p className="text-sm mt-2">
                    {item.type}
                  </p>

                  <span
                    className={`inline-block mt-3 px-3 py-1 rounded-full text-sm ${
                      item.status === "Rescheduled"
                        ? "bg-amber-100 text-amber-700"
                        : item.status === "Approved"
                        ? "bg-green-100 text-[#0F172A] font-semibold"
                        : "bg-blue-50 text-[#2563EB]"
                    }`}
                  >
                    {item.status}
                  </span>

                  {item.status === "Approved" ? (
                    <button
                      disabled
                      className="w-full mt-4 bg-green-100 text-[#0F172A] border border-green-300 py-2 rounded-xl font-semibold cursor-not-allowed text-center transition"
                    >
                      Approved
                    </button>
                  ) : (
                    <button
                      disabled={item.status === "Rescheduled"}
                      onClick={() => handleApproveAppointment(item.id)}
                      className={`w-full mt-4 py-2 rounded-xl font-medium transition ${
                        item.status === "Rescheduled"
                          ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed text-center"
                          : "bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
                      }`}
                    >
                      Approve
                    </button>
                  )}

                  <button
                    disabled={item.status === "Approved"}
                    onClick={() => {
                      setRescheduleId(item.id);

                      setFormData({
                        ...formData,
                        date: item.date,
                        time: item.time,
                      });

                      setShowModal(true);
                    }}
                    className={`w-full mt-2 border py-2 rounded-xl transition ${
                      item.status === "Approved"
                        ? "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
                        : "border-[#E2E8F0] text-[#2563EB] hover:bg-blue-50"
                    }`}
                  >
                    Reschedule
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-[#0F172A]/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg">

              <h2 className="text-2xl font-bold mb-6">
                {rescheduleId
                  ? "Reschedule Consultation"
                  : "Book Appointment"}
              </h2>

              <div className="space-y-4">

                {!rescheduleId && (
                  <>
                    <input
                      type="text"
                      placeholder="Client Name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          name: e.target.value,
                        })
                      }
                      className="w-full border rounded-xl p-3 text-[#0F172A]"
                    />

                    <input
                      type="text"
                      placeholder="Advocate Name"
                      value={formData.advocate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          advocate: e.target.value,
                        })
                      }
                      className="w-full border rounded-xl p-3 text-[#0F172A]"
                    />
                  </>
                )}

                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl p-3 text-[#0F172A]"
                />

                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      time: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl p-3 text-[#0F172A]"
                />

                {!rescheduleId && (
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value,
                      })
                    }
                    className="w-full border rounded-xl p-3 text-[#0F172A]"
                  >
                    <option value="">
                      Select Consultation Type
                    </option>

                    <option>
                      Video Consultation
                    </option>

                    <option>
                      Chat Consultation
                    </option>

                    <option>
                      Person to Person
                    </option>
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="px-5 py-2 bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    rescheduleId
                      ? handleReschedule
                      : handleBookAppointment
                  }
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl"
                >
                  {rescheduleId
                    ? "Reschedule"
                    : "Book"}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Custom Success Toast */}
        {successToast.show && (
          <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500 transition-all duration-300 max-w-sm animate-in fade-in slide-in-from-top-4">
            <span className="text-xl">✅</span>
            <div className="flex-1">
              <p className="font-bold text-sm leading-tight">Notification</p>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">{successToast.message}</p>
            </div>
            <button
              onClick={() => setSuccessToast({ show: false, message: "" })}
              className="text-emerald-200 hover:text-white font-bold ml-2 text-sm leading-none focus:outline-none"
            >
              ✕
            </button>
          </div>
        )}
      </div>
  );
}