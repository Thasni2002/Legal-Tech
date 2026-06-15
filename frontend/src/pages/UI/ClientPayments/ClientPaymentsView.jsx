"use client";

import { useState } from "react";

export default function ClientPayments() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);

  const [gpayNumber, setGpayNumber] = useState("");
  const [upiId, setUpiId] = useState("");

  // Invoice data from advocate side
  const invoice = {
    clientName: "Rahul Kumar",
    caseNumber: "CIV/101",
    mobile: "9876543210",
    email: "rahul@gmail.com",

    courtFee: 2000,
    stampDuty: 1500,
    advocateFee: 3000,
    paperFiling: 500,
    discount: 200,
  };

  const subtotal =
    invoice.courtFee +
    invoice.stampDuty +
    invoice.advocateFee +
    invoice.paperFiling;

  const gst = (subtotal * 18) / 100;

  const grandTotal = subtotal + gst - invoice.discount;

  const isPaid = paymentHistory.length > 0;

  const handlePaymentSubmit = () => {
    const paymentData = {
      date: new Date().toLocaleDateString(),
      amount: grandTotal.toFixed(2),
      status: "Paid",
      method: "UPI / GPay",
    };

    setPaymentHistory((prev) => [...prev, paymentData]);

    setPaymentSuccess(true);
    setShowPaymentModal(false);

    setGpayNumber("");
    setUpiId("");

    setTimeout(() => {
      setPaymentSuccess(false);
    }, 3000);
  };

  return (
    <div className="w-full space-y-6 md:space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
          Payments
        </h1>
        <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
          View and manage your legal fee payments
        </p>
      </div>

      {/* Success Notification */}
      {paymentSuccess && (
        <div className="bg-emerald-100 border border-[#16A34A] text-[#16A34A] px-4 py-3 rounded-lg">
          ✅ Payment completed successfully! Thank you for your payment.
        </div>
      )}

      {/* Billing Summary */}
      <div className="bg-[#F1F5F9] border rounded-xl p-5">
        <h3 className="font-bold text-lg mb-4">
          Billing Summary
        </h3>

        {/* Client Information */}
        <div className="mb-5 pb-4 border-b border-[#E2E8F0]">
          <h4 className="font-semibold mb-3">
            Client Information
          </h4>

          <div className="flex justify-between">
            <span>Client Name</span>
            <span>{invoice.clientName}</span>
          </div>

          <div className="flex justify-between">
            <span>Case Number</span>
            <span>{invoice.caseNumber}</span>
          </div>

          <div className="flex justify-between">
            <span>Mobile Number</span>
            <span>{invoice.mobile}</span>
          </div>

          <div className="flex justify-between">
            <span>Email</span>
            <span>{invoice.email}</span>
          </div>
        </div>

        {/* Billing Details */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Court Fee</span>
            <span>₹{invoice.courtFee}</span>
          </div>

          <div className="flex justify-between">
            <span>Stamp Duty</span>
            <span>₹{invoice.stampDuty}</span>
          </div>

          <div className="flex justify-between">
            <span>Advocate Fee</span>
            <span>₹{invoice.advocateFee}</span>
          </div>

          <div className="flex justify-between">
            <span>Paper Filing</span>
            <span>₹{invoice.paperFiling}</span>
          </div>

          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>

          <div className="flex justify-between">
            <span>GST (18%)</span>
            <span>₹{gst.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>Discount</span>
            <span>₹{invoice.discount}</span>
          </div>

          <div className="flex justify-between">
            <span>Invoice Status</span>
            <span
              className={`font-medium ${
                isPaid ? "text-[#16A34A]" : "text-amber-600"
              }`}
            >
              {isPaid ? "Paid" : "Pending"}
            </span>
          </div>
        </div>

        <hr className="my-4" />

        {/* Grand Total */}
        <div className="flex justify-between font-bold text-xl">
          <span>Grand Total</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>

        {/* Pay Button */}
        {!isPaid && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg"
            >
              Pay Now
            </button>
          </div>
        )}
      </div>

      {/* Payment History Table */}
      {paymentHistory.length > 0 && (
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-bold text-lg mb-4">
            Payment History
          </h3>

          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-[#F1F5F9]">
                <th className="border p-2">Date</th>
                <th className="border p-2">Amount</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Method</th>
              </tr>
            </thead>

            <tbody>
              {paymentHistory.map((payment, index) => (
                <tr key={index}>
                  <td className="border p-2">{payment.date}</td>
                  <td className="border p-2">₹{payment.amount}</td>
                  <td className="border p-2 text-[#16A34A]">
                    {payment.status}
                  </td>
                  <td className="border p-2">
                    {payment.method}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-[#0F172A]/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-[400px]">
            <h3 className="text-xl font-bold mb-4">
              Make Payment
            </h3>

            <input
              type="text"
              placeholder="Enter Your Google Pay Number"
              value={gpayNumber}
              onChange={(e) => setGpayNumber(e.target.value)}
              className="w-full border rounded-lg p-2 mb-3"
            />

            <input
              type="text"
              placeholder="Enter Your UPI ID"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full border rounded-lg p-2 mb-4"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handlePaymentSubmit}
                disabled={!gpayNumber || !upiId}
                className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803d] text-white rounded-lg disabled:bg-slate-400"
              >
                Pay ₹{grandTotal.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}