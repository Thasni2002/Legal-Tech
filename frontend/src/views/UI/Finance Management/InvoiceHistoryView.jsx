import React, { useState } from "react";
import {
  Download, Trash, ArrowLeft, Search,
  CalendarDays,
  X,
} from "lucide-react";





const InvoiceHistoryView = ({
  invoices = [],
  handleUpdateStatus = () => { },
  handleDownloadInvoicePDF = () => { },
  handleDeleteInvoice = () => { },
  onBack = () => { },
  hasPermission = () => true,
}) => {

  const [searchClient, setSearchClient] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 5;

  const filteredInvoices = invoices.filter((inv) => {
    const clientMatch = inv.client_name
      ?.toLowerCase()
      .includes(searchClient.toLowerCase());

    const invoiceDate = new Date(inv.created_at);

    const invoiceMonth = `${invoiceDate.getFullYear()}-${String(
      invoiceDate.getMonth() + 1
    ).padStart(2, "0")}`;

    const monthMatch =
      selectedMonth === "" || invoiceMonth === selectedMonth;

    return clientMatch && monthMatch;
  });

  const getHeaderLabel = (dateStr) => {
    if (!dateStr) return "GENERATED RECORD";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "GENERATED RECORD";

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const dayName = d.toLocaleDateString("en-US", { weekday: 'long' }).toUpperCase();
    const monthName = d.toLocaleDateString("en-US", { month: 'long' }).toUpperCase();
    const dayNum = d.getDate();
    const year = d.getFullYear();

    const fullFormatted = `${dayName}, ${monthName} ${dayNum}, ${year}`;

    if (targetDate.getTime() === today.getTime()) {
      return `GENERATED TODAY - ${fullFormatted}`;
    }
    if (targetDate.getTime() === yesterday.getTime()) {
      return `GENERATED YESTERDAY - ${fullFormatted}`;
    }
    return `GENERATED ON ${fullFormatted}`;
  };

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="mb-6 flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Invoice History
          </h1>
          <p className="text-sm text-[#64748B]">
            Manage all generated invoices here
          </p>
        </div>
      </div>




      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        <div className="p-5 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">

              {/* Search */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Search Client
                </label>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <input
                    type="text"
                    placeholder="Search by client..."
                    value={searchClient}
                    onChange={(e) => setSearchClient(e.target.value)}
                    className="w-full h-11 rounded-lg border border-slate-300 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Month */}
              <div className="w-full lg:w-52">
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Invoice Month
                </label>

                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full h-11 rounded-lg border border-slate-300 px-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Clear */}
              <div className="w-full lg:w-auto">
                <button
                  onClick={() => {
                    setSearchClient("");
                    setSelectedMonth("");
                  }}
                  className="w-full lg:w-auto h-11 px-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              </div>

            </div>
          </div>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              No invoices generated yet.
            </div>
          ) : (
            <>
              {/* MOBILE CARD VIEW (No horizontal scroll required) */}
              <div className="block md:hidden space-y-3.5 p-4 bg-[#F8FAFC]">
                {(() => {
                  let lastGroupKey = null;
                  return filteredInvoices
                    .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
                    .map((inv) => {
                      const rawDate = inv.created_at || "";
                      const dateKey = typeof rawDate === "string" ? rawDate.split("T")[0] : String(rawDate);
                      const showHeader = dateKey !== lastGroupKey;
                      if (showHeader) lastGroupKey = dateKey;

                      return (
                        <React.Fragment key={inv.id}>
                          {showHeader && (
                            <div className="py-2.5 px-4 text-xs font-extrabold text-[#334155] tracking-wider uppercase bg-white rounded-xl border border-[#E2E8F0] border-l-4 border-l-[#2563EB] shadow-2xs">
                              {getHeaderLabel(inv.created_at)}
                            </div>
                          )}
                          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] space-y-3 shadow-2xs">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-600 rounded mb-1">
                                  #{inv.id}
                                </span>
                                <h4 className="font-extrabold text-[#0F172A] text-sm capitalize">
                                  {inv.client_name}
                                </h4>
                                <p className="text-xs text-[#64748B] font-medium truncate max-w-[200px]">
                                  {inv.email || "No Email"}
                                </p>
                              </div>
                              <div>
                                {hasPermission("Finance Management", "edit") ? (
                                  <select
                                    value={inv.status}
                                    onChange={(e) =>
                                      handleUpdateStatus(inv.id, e.target.value)
                                    }
                                    className={`text-xs border rounded-lg px-2.5 py-1 font-bold focus:outline-none transition-colors cursor-pointer ${
                                      inv.status.toLowerCase() === "paid"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : inv.status.toLowerCase() === "sent"
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : inv.status.toLowerCase() === "overdue"
                                        ? "bg-red-50 text-red-700 border-red-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Sent">Sent</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Overdue">Overdue</option>
                                  </select>
                                ) : (
                                  <span
                                    className={`inline-block text-xs border rounded-lg px-2.5 py-1 font-bold ${
                                      inv.status.toLowerCase() === "paid"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : inv.status.toLowerCase() === "sent"
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : inv.status.toLowerCase() === "overdue"
                                        ? "bg-red-50 text-red-700 border-red-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}
                                  >
                                    {inv.status}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-[#64748B] bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]/60">
                              <div>
                                <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Case Number</span>
                                <span className="font-extrabold text-[#0F172A] font-mono">{inv.case_number || "—"}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Date</span>
                                <span className="font-semibold text-[#475569]">{new Date(inv.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                              <div>
                                <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Grand Total</span>
                                <span className="text-base font-black text-[#2563EB]">
                                  Rs. {inv.grand_total.toFixed(2)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDownloadInvoicePDF(inv)}
                                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                  title="Download PDF"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>PDF</span>
                                </button>

                                {hasPermission("Finance Management", "delete") && (
                                  <button
                                    onClick={() => handleDeleteInvoice(inv.id)}
                                    className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200 cursor-pointer shadow-2xs"
                                    title="Delete Invoice"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    });
                })()}
              </div>

              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 text-xs font-semibold bg-slate-50 uppercase tracking-wide">
                      <th className="px-4 py-3">#ID</th>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Case ID</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Grand Total</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(() => {
                      let lastGroupKey = null;
                      return filteredInvoices
                        .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
                        .map((inv) => {
                          const rawDate = inv.created_at || "";
                          const dateKey = typeof rawDate === "string" ? rawDate.split("T")[0] : String(rawDate);
                          const showHeader = dateKey !== lastGroupKey;
                          if (showHeader) lastGroupKey = dateKey;

                          return (
                            <React.Fragment key={inv.id}>
                              {showHeader && (
                                <tr className="bg-[#F8FAFC] border-t border-b border-[#E2E8F0]">
                                  <td colSpan={7} className="py-2.5 px-4 text-xs font-extrabold text-[#334155] tracking-wider uppercase border-l-4 border-l-[#2563EB]">
                                    {getHeaderLabel(inv.created_at)}
                                  </td>
                                </tr>
                              )}
                              <tr className="border-b border-slate-100 hover:bg-slate-50 transition">
                                {/* Invoice ID */}
                                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                  #{inv.id}
                                </td>

                                {/* Client */}
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-900">
                                    {inv.client_name}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    {inv.email}
                                  </div>
                                </td>

                                {/* Case ID */}
                                <td className="px-4 py-3 font-mono text-xs text-slate-600">
                                  {inv.case_number || "—"}
                                </td>

                                {/* Date */}
                                <td className="px-4 py-3 text-xs text-slate-500">
                                  {new Date(inv.created_at).toLocaleDateString()}
                                </td>

                                {/* Grand Total */}
                                <td className="px-4 py-3 text-right font-bold text-slate-900">
                                  Rs. {inv.grand_total.toFixed(2)}
                                </td>

                                {/* Status */}
                                <td className="px-4 py-3 text-center">
                                  {hasPermission("Finance Management", "edit") ? (
                                    <select
                                      value={inv.status}
                                      onChange={(e) =>
                                        handleUpdateStatus(inv.id, e.target.value)
                                      }
                                      className={`text-xs border rounded px-2.5 py-1 font-semibold focus:outline-none transition-colors ${
                                        inv.status.toLowerCase() === "paid"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : inv.status.toLowerCase() === "sent"
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : inv.status.toLowerCase() === "overdue"
                                          ? "bg-red-50 text-red-700 border-red-200"
                                          : "bg-amber-50 text-amber-700 border-amber-200"
                                      }`}
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="Sent">Sent</option>
                                      <option value="Paid">Paid</option>
                                      <option value="Overdue">Overdue</option>
                                    </select>
                                  ) : (
                                    <span
                                      className={`inline-block text-xs border rounded px-2.5 py-1 font-semibold ${
                                        inv.status.toLowerCase() === "paid"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : inv.status.toLowerCase() === "sent"
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : inv.status.toLowerCase() === "overdue"
                                          ? "bg-red-50 text-red-700 border-red-200"
                                          : "bg-amber-50 text-amber-700 border-amber-200"
                                      }`}
                                    >
                                      {inv.status}
                                    </span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3 text-center">
                                  <div className="flex justify-center gap-2">
                                    <button
                                      onClick={() => handleDownloadInvoicePDF(inv)}
                                      className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"
                                      title="Download PDF"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>

                                    {hasPermission("Finance Management", "delete") && (
                                      <button
                                        onClick={() => handleDeleteInvoice(inv.id)}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                                        title="Delete Invoice"
                                      >
                                        <Trash className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        });
                    })()}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Footer & Pagination Controls */}
          {filteredInvoices.length > pageSize && (() => {
            const total = filteredInvoices.length;
            const totalPages = Math.ceil(total / pageSize);
            const startIdx = currentPage * pageSize + 1;
            const endIdx = Math.min((currentPage + 1) * pageSize, total);

            return (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-[#E2E8F0] bg-white rounded-b-2xl pb-10 sm:pb-4">
                <span className="text-xs text-[#64748B] font-semibold text-center sm:text-left">
                  Showing <span className="font-bold text-[#0F172A]">{startIdx}</span> to <span className="font-bold text-[#0F172A]">{endIdx}</span> of <span className="font-bold text-[#0F172A]">{total}</span> invoices
                </span>
                <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-full">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs"
                  >
                    &lt; Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-2xs ${
                        currentPage === idx
                          ? "bg-[#2563EB] text-white border-[#2563EB]"
                          : "bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs"
                  >
                    Next &gt;
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      );
};

      export default InvoiceHistoryView;