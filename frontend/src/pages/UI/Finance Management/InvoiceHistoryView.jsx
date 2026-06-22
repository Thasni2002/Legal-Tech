import React from "react";
import { Download, Trash, ArrowLeft,} from "lucide-react";

const InvoiceHistoryView = ({
  invoices = [],
  handleUpdateStatus = () => {},
  handleDownloadInvoicePDF = () => {},
  handleDeleteInvoice = () => {},
  onBack = () => {},
}) => {
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
        {invoices.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            No invoices generated yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 text-xs font-semibold bg-slate-50 uppercase tracking-wide">
                  <th className="px-4 py-3">#ID</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Case ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">GPay Number</th>
                  <th className="px-4 py-3">UPI ID</th>
                  <th className="px-4 py-3 text-right">Grand Total</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition"
                  >
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

                    {/* GPay Number */}
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {inv.gpay_number || "—"}
                    </td>

                    {/* UPI ID */}
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {inv.upi_id || "—"}
                    </td>

                    {/* Grand Total */}
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      Rs. {inv.grand_total.toFixed(2)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
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

                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                          title="Delete Invoice"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white text-sm text-slate-500">
          Total: {invoices.length} invoice
          {invoices.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
};

export default InvoiceHistoryView;