
"use client";

import Link from "next/link";
import {
  Search,
  Bell,
  Phone,
  Mail,
  MapPin,
  FileText,
  MessageCircle,
  Clock,
  Wallet,
} from "lucide-react";

export default function ClientView() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b h-16 px-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">
          Client Management
        </h1>

        {/* <div className="flex items-center gap-6">
          <div className="relative hidden md:block">
            <Search
              size={18}
              className="absolute left-3 top-3 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search anything..."
              className="w-72 border rounded-lg pl-10 pr-4 py-2"
            />
          </div>

          <Bell size={20} />

          <div className="flex items-center gap-3">
            <img
              src="https://i.pravatar.cc/150?img=12"
              alt="user"
              className="w-10 h-10 rounded-full"
            />

            <div>
              <h4 className="font-semibold text-sm">
                Adv. Rahul Sharma
              </h4>
              <p className="text-xs text-gray-500">
                Advocate
              </p>
            </div>
          </div>
        </div> */}
      </header>

      <main className="p-6">
        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
          <TopCard
            title="Add / Manage Client"
            desc="Add new client or manage existing clients"
            button="Add / Manage Client"
            color="bg-green-600"
            link="/client-management/add-client"
          />

          <TopCard
            title="Communication (WhatsApp)"
            desc="Chat with clients"
            button="Open WhatsApp"
            color="bg-green-500"
          />

          <TopCard
            title="Case Tracking"
            desc="Track all cases"
            button="Track Cases"
            color="bg-blue-600"
          />

          <TopCard
            title="View History"
            desc="Communication history"
            button="View History"
            color="bg-purple-600"
          />
        </div>

        {/* Client Overview */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-bold text-xl mb-4">
              Client Overview
            </h2>

            <div className="space-y-4">
              <InfoItem
                icon={<Phone size={16} />}
                text="+91 9876543210"
              />

              <InfoItem
                icon={<Mail size={16} />}
                text="amit@gmail.com"
              />

              <InfoItem
                icon={<MapPin size={16} />}
                text="Kerala, India"
              />

              <InfoItem
                icon={<FileText size={16} />}
                text="15 Cases"
              />

              <InfoItem
                icon={<Wallet size={16} />}
                text="₹45,000 Outstanding"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-4">
              Recent Activity
            </h3>

            <ActivityItem
              title="Case Updated"
              time="10 May 2024"
            />

            <ActivityItem
              title="Document Uploaded"
              time="09 May 2024"
            />

            <ActivityItem
              title="Payment Received"
              time="05 May 2024"
            />
          </div>

          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-4">
              WhatsApp Chat
            </h3>

            <div className="space-y-3">
              <div className="bg-green-100 p-2 rounded">
                Hello Sir
              </div>

              <div className="bg-gray-100 p-2 rounded">
                Case hearing tomorrow.
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <input
                placeholder="Message..."
                className="flex-1 border rounded px-3 py-2"
              />

              <button className="bg-green-600 text-white p-2 rounded">
                <MessageCircle size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function TopCard({
  title,
  desc,
  button,
  color,
  link,
}) {
  return (
    <div className="bg-white border rounded-xl p-5">
      <h3 className="font-semibold mb-2">{title}</h3>

      <p className="text-sm text-gray-500 mb-4">
        {desc}
      </p>

      {link ? (
        <Link href={link}>
          <button
            className={`w-full py-2 rounded-lg text-white ${color}`}
          >
            {button}
          </button>
        </Link>
      ) : (
        <button
          className={`w-full py-2 rounded-lg text-white ${color}`}
        >
          {button}
        </button>
      )}
    </div>
  );
}

function InfoItem({ icon, text }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function ActivityItem({ title, time }) {
  return (
    <div className="flex justify-between py-2">
      <div className="flex items-center gap-2">
        <Clock size={16} />
        {title}
      </div>

      <span className="text-xs text-gray-500">
        {time}
      </span>
    </div>
  );
}


// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// export default function ClientView() {
//   const [client, setClient] = useState(null);
//   const router = useRouter();

//   useEffect(() => {
//     const data = localStorage.getItem("clientData");

//     if (data) {
//       setClient(JSON.parse(data));
//     }
//   }, []);

//   if (!client) {
//     return (
//       <div className="p-8">
//         <div className="bg-white rounded-lg shadow p-6">
//           <h2 className="text-xl font-bold text-red-500">
//             No Client Found
//           </h2>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-8">
//       <div className="bg-white rounded-lg shadow p-6">
//         <h1 className="text-2xl font-bold mb-6">
//           Client Details
//         </h1>

//         <div className="grid md:grid-cols-2 gap-4">
//           <p>
//             <strong>Client ID:</strong> {client.clientId}
//           </p>

//           <p>
//             <strong>Full Name:</strong> {client.fullName}
//           </p>

//           <p>
//             <strong>Email:</strong> {client.email}
//           </p>

//           <p>
//             <strong>Phone:</strong> {client.phone}
//           </p>

//           <p>
//             <strong>WhatsApp:</strong> {client.whatsapp}
//           </p>

//           <p>
//             <strong>Address:</strong> {client.address}
//           </p>

//           <p>
//             <strong>City:</strong> {client.city}
//           </p>

//           <p>
//             <strong>State:</strong> {client.state}
//           </p>

//           <p>
//             <strong>Pincode:</strong> {client.pincode}
//           </p>

//           <p>
//             <strong>Assigned Advocate:</strong>{" "}
//             {client.assignedAdvocate}
//           </p>

//           <p>
//             <strong>Case Title:</strong> {client.caseTitle}
//           </p>

//           <p>
//             <strong>Case Type:</strong> {client.caseType}
//           </p>

//           <p>
//             <strong>Case Number:</strong> {client.caseNumber}
//           </p>

//           <p>
//             <strong>Court Name:</strong> {client.courtName}
//           </p>

//           <p>
//             <strong>Next Hearing:</strong> {client.nextHearing}
//           </p>

//           <p>
//             <strong>Case Status:</strong> {client.caseStatus}
//           </p>
//         </div>

//         <button
//           onClick={() =>
//             router.push("/client-management/edit-client")
//           }
//           className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg"
//         >
//           Edit Client
//         </button>
//       </div>
//     </div>
//   );
// }