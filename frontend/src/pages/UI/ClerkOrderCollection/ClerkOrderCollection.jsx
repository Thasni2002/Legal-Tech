"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Upload, 
  UserCheck, 
  BellRing, 
  Download, 
  Plus, 
  CheckCircle2, 
  ExternalLink,
  Trash2
} from "lucide-react";
import { getLoggedInUser } from "@/utils/auth";
import { API_BASE_URL } from "@/utils/api";

export default function ClerkOrderCollection() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    case_no: "",
    case_title: "",
    order_date: new Date().toISOString().split("T")[0],
    court_name: "",
    order_type: "Interim Order",
    cc_application_no: "",
    physical_copy_collected: false,
    scanned_pdf_url: "",
    status: "Awaiting Order",
    assigned_advocate_name: "",
    client_notified: false,
    notes: ""
  });

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/order-collection`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (e) {
      console.error("Failed to load orders:", e);
    }
  };

  useEffect(() => {
    const loggedIn = getLoggedInUser();
    if (!loggedIn) {
      router.push("/login");
    } else {
      setUser(loggedIn);
      setIsLoading(true);
      fetchOrders().finally(() => setIsLoading(false));
    }
  }, [router]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/order-collection/upload-pdf`, {
        method: "POST",
        body
      });
      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({ ...prev, scanned_pdf_url: data.url }));
      }
    } catch (err) {
      console.error("Upload order pdf error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/order-collection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        const newRecord = await response.json();
        setOrders((prev) => [newRecord, ...prev]);
        setIsModalOpen(false);
        setFormData({
          case_no: "",
          case_title: "",
          order_date: new Date().toISOString().split("T")[0],
          court_name: "",
          order_type: "Interim Order",
          cc_application_no: "",
          physical_copy_collected: false,
          scanned_pdf_url: "",
          status: "Awaiting Order",
          assigned_advocate_name: "",
          client_notified: false,
          notes: ""
        });
      }
    } catch (err) {
      console.error("Save order error:", err);
    }
  };

  const handleToggleCollected = async (order) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/order-collection/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          physical_copy_collected: !order.physical_copy_collected,
          status: !order.physical_copy_collected ? "Order Received" : order.status
        })
      });
      if (response.ok) {
        const updated = await response.json();
        setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      }
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this order collection record?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/clerk/order-collection/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setOrders((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-full text-amber-300 text-xs font-bold uppercase tracking-wider">
            📜 Court Order & Certified Copy (CC) Desk
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Court Order Collection
          </h1>
          <p className="text-amber-100 text-sm max-w-2xl font-medium">
            Monitor cases awaiting bench orders, track Certified Copy (CC) applications, upload scanned PDF copies, assign to advocates, and alert clients.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-amber-600/30 transition-all hover:scale-105"
        >
          <Plus size={18} />
          Log Case Awaiting Order
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-600"></div>
          <p className="text-slate-400 text-sm font-medium">Loading court orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <FileText size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Court Orders Tracked</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Click "Log Case Awaiting Order" to track interim, final, or injunction bench orders.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-amber-800 text-xs font-bold">
                    {order.case_no}
                  </span>
                  <button onClick={() => handleDelete(order.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{order.case_title}</h3>
                <p className="text-xs text-slate-500 font-medium">{order.court_name} • Date: {order.order_date}</p>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs font-medium text-slate-600">
                  <div>Type: <strong>{order.order_type}</strong></div>
                  {order.cc_application_no && <div>CC App No: <strong className="text-amber-700">{order.cc_application_no}</strong></div>}
                  {order.assigned_advocate_name && <div>Assigned Advocate: <strong>{order.assigned_advocate_name}</strong></div>}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleToggleCollected(order)}
                    className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 ${
                      order.physical_copy_collected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {order.physical_copy_collected ? '✓ Physical Copy Collected' : 'Mark Physical Copy Collected'}
                  </button>
                </div>

                {order.scanned_pdf_url && (
                  <a
                    href={`${API_BASE_URL}${order.scanned_pdf_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-center py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border border-amber-200"
                  >
                    <Download size={14} /> Download Scanned Order PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xl font-extrabold text-slate-900">Log Case Awaiting Court Order</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm font-medium">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Case No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SLP 301/2026"
                    value={formData.case_no}
                    onChange={(e) => setFormData({ ...formData, case_no: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Case Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="Case Title"
                    value={formData.case_title}
                    onChange={(e) => setFormData({ ...formData, case_title: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Court Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="High Court / District Court"
                    value={formData.court_name}
                    onChange={(e) => setFormData({ ...formData, court_name: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Order Date</label>
                  <input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Order Type</label>
                  <select
                    value={formData.order_type}
                    onChange={(e) => setFormData({ ...formData, order_type: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Interim Order">Interim Order / Injunction</option>
                    <option value="Final Judgment">Final Judgment / Order</option>
                    <option value="Bail Order">Bail Order</option>
                    <option value="Procedural Order">Procedural Bench Order</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">CC Application No</label>
                  <input
                    type="text"
                    placeholder="Certified Copy No"
                    value={formData.cc_application_no}
                    onChange={(e) => setFormData({ ...formData, cc_application_no: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Assign to Advocate</label>
                <input
                  type="text"
                  placeholder="Advocate Name"
                  value={formData.assigned_advocate_name}
                  onChange={(e) => setFormData({ ...formData, assigned_advocate_name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Upload Scanned Order PDF</label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-600 text-white font-bold shadow-lg shadow-amber-600/30"
                >
                  Save Order Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
