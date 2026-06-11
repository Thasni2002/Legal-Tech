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
      status: "Scheduled",
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

    setFormData({
      name: "",
      advocate: "",
      date: "",
      time: "",
      type: "",
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            Consultation
          </h1>

          <p className="text-gray-500 mt-2">
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
                <h2 className="text-2xl font-semibold text-purple-700">
                  Book Appointment
                </h2>

                <p className="text-gray-500 mt-3">
                  Choose a date and time to meet your advocate.
                </p>

                <button
                  onClick={() => {
                    setRescheduleId(null);
                    setShowModal(true);
                  }}
                  className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl"
                >
                  Book Appointment
                </button>
              </div>

              <div className="bg-white rounded-2xl border p-6">
                <h2 className="text-2xl font-semibold text-green-700">
                  Video Consultation
                </h2>

                <p className="text-gray-500 mt-3">
                  Join a video consultation with your advocate.
                </p>

                <button className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl">
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
                    <tr className="bg-slate-100">
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

                  <p className="text-sm text-gray-500 mt-2">
                    {item.date}
                  </p>

                  <p className="text-sm text-gray-500">
                    {item.time}
                  </p>

                  <p className="text-sm mt-2">
                    {item.type}
                  </p>

                  <span
                    className={`inline-block mt-3 px-3 py-1 rounded-full text-sm ${
                      item.status === "Rescheduled"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {item.status}
                  </span>

                  <button
                    onClick={() => {
                      setRescheduleId(item.id);

                      setFormData({
                        ...formData,
                        date: item.date,
                        time: item.time,
                      });

                      setShowModal(true);
                    }}
                    className="w-full mt-4 border border-blue-600 text-blue-600 py-2 rounded-xl"
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
                      className="w-full border rounded-xl p-3 text-black"
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
                      className="w-full border rounded-xl p-3 text-black"
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
                  className="w-full border rounded-xl p-3 text-black"
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
                  className="w-full border rounded-xl p-3 text-black"
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
                    className="w-full border rounded-xl p-3 text-black"
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
                  className="px-5 py-2 bg-gray-300 rounded-xl"
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
      </div>
    </div>
  );
}