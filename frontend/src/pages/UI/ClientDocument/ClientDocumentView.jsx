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
    <div className="w-full space-y-6">

      {/* Header */}
      <div className="bg-white border rounded-xl p-5">
        <h1 className="text-2xl font-bold text-gray-800">
          Client Documents
        </h1>

        <p className="text-sm text-gray-500">
          Upload and manage documents for your advocate
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
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
            className="border rounded-lg p-3"
          />

          <select
            value={documentType}
            onChange={(e) =>
              setDocumentType(e.target.value)
            }
            className="border rounded-lg p-3"
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
            className="border rounded-lg p-2"
          />
        </div>

        <button
          onClick={handleUpload}
          className="mt-5 bg-blue-600 text-white px-5 py-2 rounded-lg flex items-center gap-2"
        >
          <Upload size={18} />
          Upload Document
        </button>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border p-6 shadow-sm overflow-x-auto">
        <h2 className="text-xl font-bold mb-4">
          Uploaded Documents
        </h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
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
              <tr key={doc.id} className="border-b">
                <td className="p-3">{doc.name}</td>
                <td className="p-3">{doc.type}</td>
                <td className="p-3">{doc.fileName}</td>
                <td className="p-3">{doc.date}</td>

                <td className="p-3">
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    {doc.status}
                  </span>
                </td>

                <td className="p-3 flex gap-3">

                  {/* View Real File */}
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Eye size={18} />
                  </a>

                 
                 

                  {/* Delete */}
                  <button
                    onClick={() =>
                      handleDelete(doc.id)
                    }
                    className="text-red-600 hover:text-red-800"
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