"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Upload,
  Eye,
  Pencil,
  Trash,
} from "lucide-react";

export default function ClientDocuments() {
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [file, setFile] = useState(null);

  const [documents, setDocuments] = useState([
    {
      id: 1,
      name: "Property Agreement",
      type: "Agreement",
      fileName: "agreement.pdf",
      fileUrl: "/agreement.pdf",
      date: "12 June 2026",
      status: "Submitted",
    },
  ]);

  const handleUpload = () => {
    if (!documentName || !documentType || !file) {
      alert("Please fill all fields");
      return;
    }

    const newDocument = {
      id: Date.now(),
      name: documentName,
      type: documentType,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file), // real preview URL
      date: new Date().toLocaleDateString(),
      status: "Submitted",
    };

    setDocuments((prev) => [newDocument, ...prev]);

    setDocumentName("");
    setDocumentType("");
    setFile(null);
  };

  const handleDelete = (id) => {
    setDocuments(
      documents.filter((doc) => doc.id !== id)
    );
  };

  return (
    <div className="w-full space-y-6 md:space-y-8">

      {/* Page Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
          Documents
        </h1>
        <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
          Upload and manage documents for your advocate
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl border-[#E2E8F0] p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">
          Upload New Document
        </h2>

        <div className="grid md:grid-cols-3 gap-4">

          <input
            type="text"
            placeholder="Document Title"
            value={documentName}
            onChange={(e) =>
              setDocumentName(e.target.value)
            }
            className="border-[#E2E8F0] rounded-lg p-3"
          />

          <select
            value={documentType}
            onChange={(e) =>
              setDocumentType(e.target.value)
            }
            className="border-[#E2E8F0] rounded-lg p-3"
          >
            <option value="">
              Select Document Type
            </option>
            <option>Agreement</option>
            <option>ID Proof</option>
            <option>Evidence</option>
            <option>Affidavit</option>
            <option>Case File</option>
          </select>

          <input
            type="file"
            onChange={(e) =>
              setFile(e.target.files[0])
            }
            className="border-[#E2E8F0] rounded-lg p-2"
          />
        </div>

        <button
          onClick={handleUpload}
          className="mt-5 bg-[#2563EB] text-white px-5 py-2 rounded-lg flex items-center gap-2"
        >
          <Upload size={18} />
          Upload Document
        </button>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border-[#E2E8F0] p-6 shadow-sm overflow-x-auto">
        <h2 className="text-xl font-bold mb-4">
          Uploaded Documents
        </h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F1F5F9]">
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">File Name</th>
              <th className="text-left p-3">Uploaded Date</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b border-[#E2E8F0]">
                <td className="p-3">{doc.name}</td>
                <td className="p-3">{doc.type}</td>
                <td className="p-3">{doc.fileName}</td>
                <td className="p-3">{doc.date}</td>

                <td className="p-3">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    {doc.status}
                  </span>
                </td>

                <td className="p-3 flex gap-3">

                  {/* View Real File */}
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2563EB] hover:text-[#1d4ed8]"
                  >
                    <Eye size={18} />
                  </a>

                 
                 

                  {/* Delete */}
                  <button
                    onClick={() =>
                      handleDelete(doc.id)
                    }
                    className="text-[#DC2626] hover:text-[#991b1b]"
                  >
                    <Trash size={18} />
                  </button>

                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
}