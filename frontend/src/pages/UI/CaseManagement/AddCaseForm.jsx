"use client";

import { useState } from "react";

export default function AddCaseForm() {
  const [documents, setDocuments] = useState([]);

  const [formData, setFormData] = useState({
    caseTitle: "",
    caseNo: "",
    caseType: "",
    caseCat: "",
    caseDes: "",

    clientName: "",
    contactNumber: "",
    emailId: "",

    courtName: "",
    courtType: "",

    status: "Active",

    documentType: "",
    advocate: "",
    documentFile: null,


    
  });

  const handleChange = (e) => {
  const { name, value, files } = e.target;

  setFormData({
    ...formData,
    [name]: files ? files[0] : value,
  });
};

  const handleSubmit = (e) => {
    e.preventDefault();

    const newCase = {
      ...formData,
    };


    const handleDocumentUpload = () => {

  if (
    !formData.documentType ||
    !formData.advocate ||
    !formData.documentFile
  ) {
    alert("Please fill all document fields");
    return;
  }

  const newDocument = {
    documentType: formData.documentType,
    fileName: formData.documentFile.name,
    advocate: formData.advocate,
    uploadDate: new Date().toLocaleDateString(),
  };

  setDocuments([...documents, newDocument]);

  setFormData({
    ...formData,
    documentType: "",
    advocate: "",
    documentFile: null,
  });

  alert("Document Uploaded Successfully");
};

    const existingCases =
      JSON.parse(localStorage.getItem("cases")) || [];

    existingCases.push(newCase);

    localStorage.setItem(
      "cases",
      JSON.stringify(existingCases)
    );

    alert("Case Saved Successfully");

    setFormData({
      caseTitle: "",
      caseNo: "",
      caseType: "",
      caseCat: "",
      caseDes: "",

      clientName: "",
      contactNumber: "",
      emailId: "",

      courtName: "",
      courtType: "",

      status: "Active",
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-white p-8 rounded-xl border shadow">

      {/* Add New Case */}
      <h2 className="text-2xl font-bold mb-6">
        Add New Case
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        {/* Case Information */}
        <div className="space-y-4">

          <input
            type="text"
            name="caseId"
            placeholder="Case ID"
            value={formData.caseId}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
            required
          />

          <input
            type="text"
            name="caseTitle"
            placeholder="Case Title"
            value={formData.caseTitle}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
            required
          />

          <input
            type="text"
            name="caseNo"
            placeholder="Case Number"
            value={formData.caseNo}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
            required
          />

          <select
  name="caseType"
  value={formData.caseType}
  onChange={handleChange}
  className="w-full border p-3 rounded-lg"
  required
>
  <option value="">Select Case Type</option>

  <option value="Civil">
    Civil
  </option>

  <option value="Criminal">
    Criminal
  </option>

  <option value="Family">
    Family
  </option>

  <option value="Consumer">
    Consumer
  </option>

  <option value="Corporate">
    Corporate
  </option>

  <option value="Labour">
    Labour
  </option>

  <option value="Property">
    Property
  </option>

  <option value="Motor Accident">
    Motor Accident
  </option>

  <option value="Cyber Crime">
    Cyber Crime
  </option>

  <option value="Tax">
    Tax
  </option>
</select>
          
          <textarea
            name="caseDes"
            placeholder="Case Description"
            value={formData.caseDes}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
            rows="4"
            required
          />
        </div>

        {/* Client Information */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Client Information
          </h2>

          <div className="space-y-4">

            <input
              type="text"
              name="clientName"
              placeholder="Client Name"
              value={formData.clientName}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
              required
            />

            <input
              type="tel"
              name="contactNumber"
              placeholder="Contact Number"
              value={formData.contactNumber}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
              required
            />

            <input
              type="email"
              name="emailId"
              placeholder="Email ID"
              value={formData.emailId}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
              required
            />
          </div>
        </div>

        {/* Court Information */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Court Information
          </h2>

          <div className="space-y-4">

            {/* Court Name Dropdown */}
            <select
              name="courtName"
              value={formData.courtName}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
              required
            >
              <option value="">
                Select Court Name
              </option>

              <option value="Supreme Court">
                Supreme Court
              </option>

              <option value="High Court">
                High Court
              </option>

              <option value="District Court">
                District Court
              </option>

              <option value="Family Court">
                Family Court
              </option>

              <option value="Consumer Court">
                Consumer Court
              </option>

              <option value="Motor Accident Tribunal">
                Motor Accident Tribunal
              </option>
            </select>

            {/* Court Type Dropdown */}
            <select
              name="courtType"
              value={formData.courtType}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
              required
            >
              <option value="">
                Select Court Type
              </option>

              <option value="Civil">
                Civil
              </option>

              <option value="Criminal">
                Criminal
              </option>

              <option value="Family">
                Family
              </option>

              <option value="Consumer">
                Consumer
              </option>

              <option value="Corporate">
                Corporate
              </option>

              <option value="Labour">
                Labour
              </option>
            </select>
          </div>
        </div>

        {/* Document Upload */}
<div>

  <h2 className="text-2xl font-bold mb-4">
    Document Upload
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

    <select
      name="documentType"
      value={formData.documentType}
      onChange={handleChange}
      className="border p-3 rounded-lg"
    >
      <option value="">
        Select Document Type
      </option>

      <option value="Petition">
        Petition
      </option>

      <option value="Evidence">
        Evidence
      </option>

      <option value="Affidavit">
        Affidavit
      </option>

      <option value="Judgment">
        Judgment
      </option>

      <option value="Notice">
        Notice
      </option>

    </select>

    <input
      type="file"
      name="documentFile"
      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      onChange={handleChange}
      className="border p-3 rounded-lg"
    />

    <select
      name="advocate"
      value={formData.advocate}
      onChange={handleChange}
      className="border p-3 rounded-lg"
    >
      <option value="">
        Uploaded By
      </option>

      <option value="Adv. Rahul Sharma">
        Adv. Rahul Sharma
      </option>

      <option value="Adv. Priya Verma">
        Adv. Priya Verma
      </option>

      <option value="Adv. Arjun Nair">
        Adv. Arjun Nair
      </option>

    </select>

    <input
      type="text"
      value={new Date().toLocaleDateString()}
      readOnly
      className="border p-3 rounded-lg bg-gray-100"
    />

    {/* <button
      type="button"
      onClick={handleDocumentUpload}
      className="bg-green-600 text-white rounded-lg px-4 py-3"
    >
      Upload
    </button> */}

  </div>

  {documents.length > 0 && (

    <div className="mt-6 overflow-x-auto">

      <table className="w-full border">

        <thead>

          <tr className="bg-gray-100">

            <th className="border p-3">
              Document Type
            </th>

            <th className="border p-3">
              File Name
            </th>

            <th className="border p-3">
              Uploaded By
            </th>

            <th className="border p-3">
              Upload Date
            </th>

          </tr>

        </thead>

        <tbody>

          {documents.map((doc, index) => (

            <tr key={index}>

              <td className="border p-3">
                {doc.documentType}
              </td>

              <td className="border p-3">
                {doc.fileName}
              </td>

              <td className="border p-3">
                {doc.advocate}
              </td>

              <td className="border p-3">
                {doc.uploadDate}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )}

</div>



        {/* Status */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Case Status
          </h2>

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
          >
            <option value="Active">
              Active
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Closed">
              Closed
            </option>
          </select>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Save Case
        </button>

      </form>
    </div>
  );
}