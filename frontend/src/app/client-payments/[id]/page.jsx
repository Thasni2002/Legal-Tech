"use client";
import { API_BASE_URL } from "@/utils/api";

import { useEffect, use } from "react";

const Page = ({ params }) => {
  // Fix Next.js dynamic params issue
  const resolvedParams = use(params);

  useEffect(() => {
    const startPayment = async () => {
      try {
        // Fetch invoice details
        const invoiceRes = await fetch(
          `${API_BASE_URL}/finance/invoices/${resolvedParams.id}`
        );

        if (!invoiceRes.ok) {
          alert("Failed to fetch invoice details");
          return;
        }

        const invoice = await invoiceRes.json();

        // Create Razorpay order
        const orderRes = await fetch(
          `${API_BASE_URL}/finance/payment/create-order`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: invoice.grand_total,
              invoice_id: Number(resolvedParams.id),
            }),
          }
        );

        if (!orderRes.ok) {
          const errorData = await orderRes.json();
          console.log("Order Error:", errorData);
          alert("Failed to create payment order");
          return;
        }

        const orderData = await orderRes.json();

        // Razorpay options
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          order_id: orderData.id,
          name: "Legal Tech",
          description: `Invoice Payment #${invoice.id}`,

          prefill: {
            name: invoice.client_name || "",
            email: invoice.email || "",
            contact: invoice.mobile_number || "",
          },

          theme: {
            color: "#2563EB",
          },

          handler: async function (response) {
            try {
              const verifyRes = await fetch(
                `${API_BASE_URL}/finance/payment/verify`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    invoice_id: Number(resolvedParams.id),
                  }),
                }
              );

              const verifyData = await verifyRes.json();

              if (verifyRes.ok && verifyData.success) {
                alert("Payment successful!");
                window.location.href = "/client-payments";
              } else {
                alert("Payment verification failed");
              }
            } catch (error) {
              console.error("Verification Error:", error);
              alert("Payment verification error");
            }
          },

          modal: {
            ondismiss: function () {
              console.log("Payment popup closed");
            },
          },
        };

        // Check Razorpay loaded
        if (!window.Razorpay) {
          alert("Razorpay SDK not loaded");
          return;
        }

        const razorpay = new window.Razorpay(options);
        razorpay.open();

      } catch (error) {
        console.error("Payment error:", error);
        alert("Something went wrong while processing payment");
      }
    };

    startPayment();
  }, [resolvedParams.id]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg font-semibold text-slate-700">
        Opening payment gateway...
      </p>
    </div>
  );
};

export default Page;