"use client";

import { API_BASE_URL } from "@/utils/api";
import { DISTRICT_COURTS } from "@/utils/districtCourts";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, X, Eye, CheckCircle, Edit3 } from "lucide-react";

const keralaCaseCategories = {
  "Civil Cases": [
    "OP – Original Petition",
    "OS – Original Suit",
    "AS – Appeal Suit",
    "RFA – Regular First Appeal",
    "RSA – Regular Second Appeal",
    "CRP – Civil Revision Petition",
    "CMA – Civil Miscellaneous Appeal",
    "CMP – Civil Miscellaneous Petition",
    "IA – Interlocutory Application",
    "EP – Execution Petition",
    "EA – Execution Application",
    "OP(C) – Original Petition (Civil)",
    "WP(C) – Writ Petition (Civil)",
    "WA – Writ Appeal",
    "RP – Review Petition"
  ],
  "Criminal Cases": [
    "CC – Calendar Case",
    "SC – Sessions Case",
    "ST – Special Trial",
    "CRL.MC – Criminal Miscellaneous Case",
    "Crl.A – Criminal Appeal",
    "Crl.RP – Criminal Revision Petition",
    "OP(Crl) – Original Petition (Criminal)",
    "Bail Appl. – Bail Application",
    "Anticipatory Bail – Anticipatory Bail Application"
  ],
  "Family Court Cases": [
    "OP – Original Petition",
    "MC – Maintenance Case",
    "G&W – Guardians and Wards Case",
    "Divorce OP – Divorce Petition",
    "Restitution of Conjugal Rights (RCR)",
    "Custody Petition",
    "Adoption Petition"
  ],
  "Motor Accident Cases": [
    "OP(MV) – Motor Vehicle Original Petition",
    "MACT – Motor Accident Claims Tribunal Case"
  ],
  "Consumer Cases": [
    "CC – Consumer Complaint",
    "FA – First Appeal (Consumer)"
  ],
  "Labour & Tribunal Cases": [
    "OA – Original Application",
    "OP(KAT) – Original Petition (Kerala Administrative Tribunal)",
    "ID – Industrial Dispute"
  ],
  "Company & Commercial Cases": [
    "CP – Company Petition",
    "ARB – Arbitration Petition",
    "Insolvency Petition"
  ],
  "Rent Control Cases": [
    "RCP – Rent Control Petition",
    "RCA – Rent Control Appeal",
    "RCR – Rent Control Revision"
  ],
  "Revenue & Land Cases": [
    "LAA – Land Acquisition Appeal",
    "LRP – Land Reforms Petition"
  ],
  "Cheque & Financial Cases": [
    "NI Act Case (Section 138)",
    "Money Suit",
    "Recovery Suit"
  ]
};

const documentCategories = {
  "Pleadings": [
    "Petition",
    "Plaint",
    "Written Statement",
    "Counter Affidavit",
    "Reply Statement",
    "Objection",
    "Rejoinder",
    "Replication",
    "Appeal Memorandum",
    "Revision Petition",
    "Review Petition"
  ],
  "Affidavits": [
    "Affidavit",
    "Supporting Affidavit",
    "Counter Affidavit",
    "Proof Affidavit",
    "Additional Affidavit"
  ],
  "Applications": [
    "Interlocutory Application (IA)",
    "Miscellaneous Application",
    "Bail Application",
    "Anticipatory Bail Application",
    "Stay Petition",
    "Delay Condonation Petition",
    "Restoration Petition",
    "Amendment Petition",
    "Impleading Petition",
    "Execution Petition"
  ],
  "Evidence/Documents": [
    "Sale Deed",
    "Title Deed",
    "Agreement",
    "Will",
    "Power of Attorney",
    "Legal Notice",
    "Reply Notice",
    "FIR",
    "Charge Sheet",
    "Final Report",
    "Medical Certificate",
    "Postmortem Report",
    "Accident Report",
    "Insurance Policy",
    "Tax Receipt",
    "Property Tax Receipt",
    "Encumbrance Certificate (EC)",
    "Possession Certificate",
    "Birth Certificate",
    "Death Certificate",
    "Marriage Certificate",
    "Aadhaar Card",
    "PAN Card",
    "Passport",
    "Driving Licence",
    "Ration Card",
    "Voter ID",
    "Photographs",
    "Bank Statement",
    "Passbook Copy",
    "Bills/Invoices",
    "Receipts",
    "Email/Chat Printouts",
    "Call Records",
    "CCTV Images",
    "Audio Recording Transcript",
    "Video Recording Transcript"
  ],
  "Court Documents": [
    "Summons",
    "Notice",
    "Warrant",
    "Court Order",
    "Interim Order",
    "Judgment",
    "Decree",
    "Commission Report",
    "Advocate Commission Report",
    "Court Fee Receipt",
    "Filing Receipt",
    "Certified Copy",
    "Cause List"
  ],
  "Advocate Documents": [
    "Vakalatnama",
    "Memo of Appearance",
    "Memo",
    "Case Diary",
    "Case Notes",
    "Brief Notes",
    "Written Arguments",
    "Synopsis",
    "List of Witnesses",
    "List of Documents"
  ],
  "Witness Documents": [
    "Witness Statement",
    "Chief Examination",
    "Cross Examination",
    "Re-Examination",
    "Expert Opinion"
  ]
};

const courtMappings = {
  "Supreme Court": ["Civil","Criminal", "Constitutional","Appellate","Public Interest Litigation (PIL)","Election", "Tax","Corporate","Environmental", "Other"],
  "High Court": [
    "Civil",
    "Criminal",
    "Family",
    "Company",
    "Labour",
    "Consumer",
    "Tax",
    "Writ Petition",
    "Appeal",
    "Bail",
    "Public Interest Litigation (PIL)",
    "Other"
  ],
  "District Court": [
    "Civil",
    "Criminal",
    "Property",
    "Money Recovery",
    "Execution",
    "Appeal",
    "Succession",
    "Other"
  ],
  "Family Court": [
    "Divorce",
    "Child Custody",
    "Maintenance",
    "Domestic Violence",
    "Adoption",
    "Guardianship",
    "Marriage",
    "Other"
  ],
  "Consumer Court": [
    "Consumer Complaint",
    "Medical Negligence",
    "Banking",
    "Insurance",
    "E-Commerce",
    "Defective Products",
    "Unfair Trade Practice",
    "Other"
  ],
  "Motor Accident Claims Tribunal (MACT)": [
    "Motor Accident Claim",
    "Compensation",
    "Insurance Claim",
    "Fatal Accident",
    "Permanent Disability",
    "Vehicle Damage",
    "Other"
  ],
  "Labour Court": [
    "Termination",
    "Salary Dispute",
    "Industrial Dispute",
    "Retirement Benefits",
    "PF",
    "ESI",
    "Compensation",
    "Other"
  ],
  "Sessions Court": [
    "Murder",
    "Attempt to Murder",
    "Robbery",
    "Rape",
    "NDPS",
    "Economic Offence",
    "Appeal",
    "Other"
  ],
  "Commercial Court": [
    "Contract Dispute",
    "Company Dispute",
    "Partnership",
    "Trademark",
    "Copyright",
    "Patent",
    "Commercial Recovery",
    "Other"
  ],
  "Other": ["Other"]
};

const getTypesForCourtName = (courtName) => {
  if (!courtName) return ["Civil", "Criminal", "Appellate", "Original Jurisdiction", "Sessions", "Other"];
  
  if (courtName.includes("District & Sessions") || courtName.includes("District Court")) {
    return [
      "Civil",
      "Criminal",
      "Appellate",
      "Original Jurisdiction",
      "Sessions",
      "Other"
    ];
  }
  
  if (courtName.includes("Sub Court")) {
    return [
      "Civil",
      "Criminal",
      "Appellate",
      "Original Jurisdiction",
      "Other"
    ];
  }
  
  if (courtName.includes("Munsiff Court")) {
    return [
      "Civil",
      "Original Jurisdiction",
      "Small Cause",
      "Other"
    ];
  }

  if (courtName.includes("Magistrate") || courtName.includes("CJM") || courtName.includes("JFCM")) {
    return [
      "Criminal",
      "Summary Trial",
      "Bail",
      "Other"
    ];
  }

  if (courtName.includes("Family")) {
    return [
      "Divorce",
      "Child Custody",
      "Maintenance",
      "Domestic Violence",
      "Adoption",
      "Guardianship",
      "Marriage",
      "Other"
    ];
  }

  if (courtName.includes("MACT") || courtName.includes("Accident")) {
    return [
      "Motor Accident Claim",
      "Compensation",
      "Insurance Claim",
      "Fatal Accident",
      "Permanent Disability",
      "Vehicle Damage",
      "Other"
    ];
  }

  if (courtName.includes("Consumer")) {
    return [
      "Consumer Complaint",
      "Medical Negligence",
      "Banking",
      "Insurance",
      "E-Commerce",
      "Defective Products",
      "Unfair Trade Practice",
      "Other"
    ];
  }

  if (courtName.includes("High Court")) {
    return [
      "Civil",
      "Criminal",
      "Family",
      "Company",
      "Labour",
      "Consumer",
      "Tax",
      "Writ Petition",
      "Appeal",
      "Bail",
      "Public Interest Litigation (PIL)",
      "Other"
    ];
  }

  if (courtName.includes("Supreme Court")) {
    return [
      "Civil",
      "Criminal",
      "Constitutional",
      "Appellate",
      "Public Interest Litigation (PIL)",
      "Election",
      "Tax",
      "Corporate",
      "Environmental",
      "Other"
    ];
  }

  if (courtMappings[courtName] && courtMappings[courtName].length > 0) {
    return courtMappings[courtName];
  }

  return ["Civil", "Criminal", "Appellate", "Original Jurisdiction", "Sessions", "Other"];
};

const categoryCourtKeywords = {
  "Family Court Cases": ["Family Court"],
  "Motor Accident Cases": ["MACT", "Accident"],
  "Consumer Cases": ["Consumer"],
  "Labour & Tribunal Cases": ["Labour", "KAT", "Industrial", "Tribunal"],
  "Company & Commercial Cases": ["Commercial Court", "High Court", "Sub Court", "District & Sessions"],
  "Rent Control Cases": ["Rent Control", "Munsiff Court", "Sub Court", "District & Sessions"],
  "Revenue & Land Cases": ["Sub Court", "District & Sessions", "Munsiff Court", "High Court"],
  "Cheque & Financial Cases": ["Judicial First Class Magistrate", "CJM", "Magistrate", "Sub Court", "Munsiff Court"],
  "Criminal Cases": ["Sessions", "Magistrate", "CJM", "JFCM", "POCSO", "Vigilance", "CBI", "Sub Court", "District & Sessions", "High Court"],
  "Civil Cases": ["Sub Court", "Munsiff Court", "District & Sessions", "High Court", "Commercial Court"]
};

const getCourtsForCategoryAndDistrict = (category, district, showAll = false) => {
  let baseCourts = [];
  if (district && DISTRICT_COURTS[district]) {
    baseCourts = DISTRICT_COURTS[district];
  } else {
    baseCourts = Object.values(DISTRICT_COURTS).flat();
  }

  const keywords = category ? categoryCourtKeywords[category] : null;
  if (!keywords) {
    return { courts: baseCourts, canFilter: false };
  }

  const categoryFiltered = baseCourts.filter((court) =>
    keywords.some((kw) => court.toLowerCase().includes(kw.toLowerCase()))
  );

  const canFilter = categoryFiltered.length > 0;

  if (showAll || !canFilter) {
    return { courts: baseCourts, canFilter };
  }

  return { courts: categoryFiltered, canFilter };
};

// Error message component
function ErrorMsg({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1.5 animate-[fadeInError_0.2s_ease]">
      <span className="w-4 h-4 rounded-full bg-red-100 text-red-500 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">!</span>
      {message}
    </p>
  );
}

export default function AddCaseForm({ editId: propEditId } = {}) {
  const router = useRouter();
  const params = useParams();
  const editId = propEditId || params?.id;

  const isEditMode = !!editId;
  const [documents, setDocuments] = useState([
    { documentCategory: "", documentType: "", advocate: "", file: null },
  ]);


  const [formData, setFormData] = useState({
    cnrNumber: "",
    caseId: "",
    caseTitle: "",
    caseNo: "",
    caseType: "",
    facts: "",
    clientRole: "",
    clientName: "",
    contactNumber: "",
    emailId: "",
    clientAddress: "",
    clientDistrict: "",
    tempPassword: "",
    courtName: "",
    courtType: "",
    status: "Active",
    nextHearingDate: "",
  });

  const [loadingEdit, setLoadingEdit] = useState(false);
  const [ecourtsLoading, setEcourtsLoading] = useState(false);

  const handleFetchFromECourts = async () => {
    const cnr = (formData.cnrNumber || "").trim().toUpperCase();
    if (!cnr) {
      alert("Please enter a 16-character CNR Number first.");
      return;
    }
    setEcourtsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ecourts/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnrNumber: cnr }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to fetch from eCourts");
      }
      const data = await res.json();

      // Smart category & subtype matching from live eCourts payload
      let category = "Cheque & Financial Cases";
      let subtype = "NI Act Case (Section 138)";

      if (data.caseType) {
        const typeLower = data.caseType.toLowerCase();
        if (typeLower.includes("ni act") || typeLower.includes("138") || typeLower.includes("cheque")) {
          category = "Cheque & Financial Cases";
          subtype = "NI Act Case (Section 138)";
        } else if (typeLower.includes("sessions") || typeLower.includes("special trial") || typeLower.includes("st")) {
          category = "Cheque & Financial Cases";
          subtype = "NI Act Case (Section 138)";
        } else if (typeLower.includes("criminal") || typeLower.includes("crl")) {
          category = "Criminal Cases";
          subtype = "CC – Calendar Case";
        } else if (typeLower.includes("civil") || typeLower.includes("suit") || typeLower.includes("os")) {
          category = "Civil Cases";
          subtype = "OS – Original Suit";
        } else if (typeLower.includes("family") || typeLower.includes("divorce") || typeLower.includes("op")) {
          category = "Family Court Cases";
          subtype = "OP – Original Petition";
        }
      }

      setSelectedCategory(category);
      setSelectedSubtype(subtype);

      const districtFetched = data.district || "Kollam";

      setFormData((prev) => ({
        ...prev,
        cnrNumber: data.cnrNumber || cnr,
        caseTitle: data.caseTitle || prev.caseTitle,
        courtName: data.courtName || prev.courtName,
        courtType: data.courtType || prev.courtType || "Magistrate Court",
        caseType: `${category}: ${subtype}`,
        caseNo: data.caseNo || prev.caseNo,
        nextHearingDate: data.nextHearingDate || prev.nextHearingDate,
        clientName: data.petitioner || prev.clientName,
        clientDistrict: districtFetched,
        facts: data.caseStage
          ? `Stage: ${data.caseStage}\nPetitioner: ${data.petitioner || "N/A"}\nRespondent: ${data.respondent || "N/A"}\nJudge: ${data.presidingJudge || "N/A"}`
          : prev.facts,
      }));

      if (data.petitioner && !formData.clientName) {
        setClientMode("new");
      }

      alert(`✨ Real eCourts Data Fetched Successfully!\n\nCase Title: ${data.caseTitle}\nCourt: ${data.courtName}\nCase No: ${data.caseNo}\nNext Hearing: ${data.nextHearingDate || "N/A"}`);
    } catch (err) {
      alert(`⚠️ eCourts Fetch Error: ${err.message}`);
    } finally {
      setEcourtsLoading(false);
    }
  };

  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Success popup
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [selectedAdvocate, setSelectedAdvocate] = useState("");
  const [clientMode, setClientMode] = useState(""); // "" | "new" | "existing"
  const [existingClients, setExistingClients] = useState([]);
  const [existingUsers, setExistingUsers] = useState([]);
  const [existingCases, setExistingCases] = useState([]);
  const [originalEmail, setOriginalEmail] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubtype, setSelectedSubtype] = useState("");
  const [showAllCourts, setShowAllCourts] = useState(false);

  const { courts: availableCourts, canFilter: canFilterByCategory } = getCourtsForCategoryAndDistrict(
    selectedCategory,
    formData.clientDistrict,
    showAllCourts
  );

  // ─── Fetch case data for edit mode ───
  async function fetchCaseForEdit(id) {
    setLoadingEdit(true);
    try {
      const res = await fetch(`${API_BASE_URL}/case-management/${id}`);
      if (!res.ok) throw new Error("Case not found");
      const data = await res.json();
      const dbCaseType = data.case_type || "";
      let category = "";
      let subtype = "";
      if (dbCaseType.includes(": ")) {
        const parts = dbCaseType.split(": ");
        category = parts[0];
        subtype = parts[1];
      } else {
        category = dbCaseType;
      }
      setSelectedCategory(category);
      setSelectedSubtype(subtype);
      setFormData({
        cnrNumber: data.cnr_number || "",
        caseId: data.case_id || (data.id ? `case-${new Date(data.created_at || Date.now()).getFullYear()}-${String(data.id).padStart(3, "0")}` : ""),
        caseTitle: data.case_title || "",
        caseNo: data.case_no || "",
        caseType: data.case_type || "",
        caseCat: "",
        facts: (() => {
          const rawDes = data.case_description || "";
          if (rawDes.startsWith("Facts:\n")) {
            const parts = rawDes.split("\n\nIssues:\n");
            return parts[0].replace("Facts:\n", "");
          }
          return rawDes;
        })(),
        clientName: data.client_name || "",
        contactNumber: data.contact_number || "",
        emailId: data.email_id || "",
        clientRole: data.client_role || "",
        clientAddress: data.client_address || "",
        clientDistrict: data.client_district || "",
        courtName: data.court_name || "",
        courtType: data.court_type || "",
        status: data.status || "Active",
        nextHearingDate: data.next_hearing_date || "",
      });
      setSelectedAdvocate(data.selected_advocate || "");
      setOriginalEmail(data.email_id || "");
      if (data.documents) {
        let docsArr = data.documents;
        if (typeof docsArr === "string") {
          try {
            docsArr = JSON.parse(docsArr);
          } catch (e) {
            docsArr = [];
          }
        }
        if (Array.isArray(docsArr) && docsArr.length > 0) {
          setDocuments(docsArr.map(d => {
            const rawType = d.documentType || "";
            let category = "";
            let subtype = rawType;
            if (rawType.includes(": ")) {
              const parts = rawType.split(": ");
              category = parts[0];
              subtype = parts[1];
            } else {
              for (const [cat, types] of Object.entries(documentCategories)) {
                if (types.includes(rawType)) {
                  category = cat;
                  break;
                }
              }
              if (!category) category = "Evidence/Documents";
            }
            return {
              documentCategory: category,
              documentType: subtype,
              advocate: d.advocate || "",
              file: d.file ? { name: d.file } : null,
              url: d.url || null,
              password: d.password || "",
            };
          }));
        }
      }
      setClientMode("new"); // Force show fields in edit mode
    } catch (err) {
      console.error("Error loading case:", err);
      alert("Failed to load case data.");
    } finally {
      setLoadingEdit(false);
    }
  }

  // ─── Fetch existing clients ───
  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/case-management/`);
      const data = await res.json();
      const casesArray = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
        ? data.results
        : Array.isArray(data.data)
        ? data.data
        : [];
      
      setExistingCases(casesArray);

      const uniqueClients = [];
      const seen = new Set();
      casesArray.forEach(c => {
        if (c.client_name && !seen.has(c.client_name.toLowerCase())) {
          seen.add(c.client_name.toLowerCase());
          uniqueClients.push({
            clientName: c.client_name,
            contactNumber: c.contact_number || "",
            emailId: c.email_id || "",
            clientRole: c.client_role || "",
            clientAddress: c.client_address || "",
            clientDistrict: c.client_district || "",
          });
        }
      });
      setExistingClients(uniqueClients);

      // Generate sequential Case ID based on continuous database count
      if (!isEditMode) {
        const currentYear = new Date().getFullYear();
        let maxSeq = 0;
        casesArray.forEach(c => {
          if (c.case_id && typeof c.case_id === 'string') {
            const parts = c.case_id.split("-");
            const lastNum = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(lastNum) && lastNum > maxSeq) {
              maxSeq = lastNum;
            }
          }
          if (c.id && typeof c.id === 'number' && c.id > maxSeq) {
            maxSeq = c.id;
          }
        });
        const nextSeq = String(maxSeq + 1).padStart(3, "0");
        const generated = `case-${currentYear}-${nextSeq}`;
        setFormData(prev => ({ ...prev, caseId: generated }));
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err);
      if (!isEditMode) {
        const currentYear = new Date().getFullYear();
        setFormData(prev => (prev.caseId ? prev : { ...prev, caseId: `case-${currentYear}-001` }));
      }
    }
  };

  // ─── Fetch existing users ───
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/permissions/users`);
      if (res.ok) {
        const data = await res.json();
        setExistingUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  useEffect(() => {
    if (!isEditMode) {
      const currentYear = new Date().getFullYear();
      setFormData(prev => (prev.caseId ? prev : { ...prev, caseId: `case-${currentYear}-001` }));
    }
    fetchClients();
    fetchUsers();
    if (isEditMode) {
      fetchCaseForEdit(editId);
    }
  }, [editId]);

  // ─── Validate a single field ───
  function validateField(name, value) {
    switch (name) {
      case "cnrNumber": {
        const val = value.trim();
        if (!val) return "CNR Number is required";
        if (val.length !== 16) {
          return "CNR Number must be exactly 16 characters (e.g., KLAL010012342026)";
        }
        if (!/^[a-zA-Z]{4}[a-zA-Z0-9]{2}\d{10}$/.test(val)) {
          return "Invalid format. Expected State(2L) + District(2L) + Est(2AN) + CaseNo(6D) + Year(4D) (e.g., KLAL010012342026)";
        }
        const valUpper = val.toUpperCase();
        const duplicate = (existingCases || []).some(
          (c) =>
            c.cnr_number &&
            c.cnr_number.trim().toUpperCase() === valUpper &&
            (!isEditMode || String(c.id) !== String(editId))
        );
        if (duplicate) {
          return "This CNR Number is already registered with another case.";
        }
        return "";
      }
      case "caseId":
        // Auto-generated — no validation needed
        return "";
      case "caseTitle":
        if (!value.trim()) return "Case Title is required";
        if (value.trim().length < 3) return "Case Title must be at least 3 characters";
        return "";
      case "caseType":
        if (!value) return "Please select a Case Category and Subtype";
        if (value.includes(": ")) {
          const parts = value.split(": ");
          if (!parts[1] || parts[1].trim() === "") {
            return "Please select a Case Subtype";
          }
        } else {
          return "Please select both Case Category and Subtype";
        }
        return "";
      case "facts":
        if (!value.trim()) return "Facts are required";
        if (value.trim().length < 10) return "Facts must be at least 10 characters";
        return "";
      case "clientRole":
        if (!value) return "Please select a Client Role";
        return "";
      case "clientName":
        if (!value.trim()) return "Client Name is required";
        if (!/^[a-zA-Z\s.]+$/.test(value.trim())) return "Client Name must contain only letters";
        if (value.trim().length < 2) return "Client Name must be at least 2 characters";
        return "";
      case "contactNumber":
        if (!value) return "Contact Number is required";
        if (value.length !== 10) return "Contact number must be exactly 10 digits";
        return "";
      case "emailId":
        if (!value.trim()) return "Email Address is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address";
        if (!isEditMode && clientMode === "new") {
          if (isEditMode && value.trim().toLowerCase() === (originalEmail || "").trim().toLowerCase()) {
            return "";
          }
          const emailExists = (existingClients || []).some(
            (c) => c.emailId && typeof c.emailId === "string" && c.emailId.trim().toLowerCase() === value.trim().toLowerCase()
          );
          if (emailExists) {
            return "This email is already associated with another client";
          }
          const emailExistsInUsers = (existingUsers || []).some(
            (u) => u.email && typeof u.email === "string" && u.email.trim().toLowerCase() === value.trim().toLowerCase()
          );
          if (emailExistsInUsers) {
            return "A user account with this email already exists";
          }
          const username = value.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
          const usernameExistsInUsers = (existingUsers || []).some(
            (u) => u.username && typeof u.username === "string" && u.username.trim().toLowerCase() === username
          );
          if (usernameExistsInUsers) {
            return "This email address generates a username that already exists";
          }
        }
        return "";
      case "courtName":
        if (!value) return "Please select a Court Name";
        return "";
      case "courtType":
        if (!value) return "Please select a Court Type";
        return "";
      case "nextHearingDate":
        if (!value) return "Date is required";
        return "";
      case "tempPassword":
        if (!isEditMode && clientMode === "new") {
          if (!value.trim()) return "Temporary Password is required";
          if (value.trim().length < 6) return "Password must be at least 6 characters";
        }
        return "";
      default:
        return "";
    }
  }

  const handleExistingClientChange = (e) => {
    const selectedName = e.target.value;
    if (!selectedName) {
      setFormData(prev => ({ ...prev, clientName: "", contactNumber: "", emailId: "", clientRole: "", clientAddress: "", clientDistrict: "", tempPassword: "" }));
      return;
    }
    const client = existingClients.find(c => c.clientName === selectedName);
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientName: client.clientName,
        contactNumber: client.contactNumber,
        emailId: client.emailId,
        clientRole: client.clientRole || prev.clientRole,
        clientAddress: client.clientAddress || prev.clientAddress,
        clientDistrict: client.clientDistrict || prev.clientDistrict,
        tempPassword: "",
      }));
      setErrors(prev => ({ ...prev, clientName: "", contactNumber: "", emailId: "", tempPassword: "" }));
    } else {
      setFormData(prev => ({ ...prev, clientName: selectedName, contactNumber: "", emailId: "", tempPassword: "" }));
    }
  };

  function validateAll() {
    const fields = ["cnrNumber", "caseTitle", "caseType", "facts", "clientRole", "clientName", "contactNumber", "emailId", "courtName", "courtType"];
    if (!isEditMode && clientMode === "new") {
      fields.push("tempPassword");
    }
    const newErrors = {};
    const newTouched = {};
    let valid = true;
    fields.forEach((f) => {
      const err = validateField(f, formData[f] || "");
      newErrors[f] = err;
      newTouched[f] = true;
      if (err) valid = false;
    });
    setErrors(newErrors);
    setTouched(newTouched);
    return valid;
  }

  function getBorderClass(field) {
    if (touched[field] && errors[field]) {
      return "border-red-400 focus:ring-red-200 focus:border-red-400";
    }
    return "border-[#E2E8F0] focus:ring-[#2563EB]/20 focus:border-[#2563EB]";
  }

  const baseInputClass =
    "w-full rounded-lg border bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 outline-none transition-all duration-200";

  const handleChange = (e) => {
    const { name, value } = e.target;

    let val = value;

    // CNR auto uppercase + limit
    if (name === "cnrNumber") {
      val = value.toUpperCase().slice(0, 16);
    }

    // Contact number only digits + limit
    if (name === "contactNumber") {
      val = value.replace(/\D/g, "").slice(0, 10);
    }

    // Address auto-district extraction
    if (name === "clientAddress") {
      const lowerAddress = val.toLowerCase();
      const matchedDistrict = Object.keys(DISTRICT_COURTS).find((dist) =>
        lowerAddress.includes(dist.toLowerCase())
      );
      if (matchedDistrict) {
        const { courts } = getCourtsForCategoryAndDistrict(selectedCategory, matchedDistrict, showAllCourts);
        let newCourtName = formData.courtName;
        if (courts && courts.length > 0 && (!newCourtName || !courts.includes(newCourtName))) {
          newCourtName = courts[0];
        }
        const types = getTypesForCourtName(newCourtName);
        const newCourtType = types && types.length > 0 ? types[0] : "Civil";

        setFormData((prev) => ({
          ...prev,
          clientAddress: val,
          clientDistrict: matchedDistrict,
          courtName: newCourtName,
          courtType: newCourtType,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          clientAddress: val,
        }));
      }
    } else if (name === "clientDistrict") {
      const { courts } = getCourtsForCategoryAndDistrict(selectedCategory, val, showAllCourts);
      let newCourtName = formData.courtName;
      if (courts && courts.length > 0 && (!newCourtName || !courts.includes(newCourtName))) {
        newCourtName = courts[0];
      }
      const types = getTypesForCourtName(newCourtName);
      const newCourtType = types && types.length > 0 ? types[0] : "Civil";

      setFormData((prev) => ({
        ...prev,
        clientDistrict: val,
        courtName: newCourtName,
        courtType: newCourtType,
      }));
    } else if (name === "courtName") {
      const types = getTypesForCourtName(val);
      setFormData((prev) => ({
        ...prev,
        [name]: val,
        courtType: types && types.length > 0 ? types[0] : "Civil",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: val,
      }));
    }

    // Validate while typing
    const error = validateField(name, val);

    // Mark field touched
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Set error
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setSelectedCategory(cat);
    setSelectedSubtype("");

    const combinedType = cat ? `${cat}: ` : "";

    const { courts } = getCourtsForCategoryAndDistrict(cat, formData.clientDistrict, showAllCourts);
    let newCourtName = formData.courtName;
    if (courts && courts.length > 0) {
      if (!newCourtName || !courts.includes(newCourtName)) {
        newCourtName = courts[0];
      }
    }
    const newCourtTypes = getTypesForCourtName(newCourtName);
    const newCourtType = newCourtTypes && newCourtTypes.length > 0 ? newCourtTypes[0] : "Civil";

    setFormData((prev) => ({
      ...prev,
      caseType: combinedType,
      courtName: newCourtName,
      courtType: newCourtType,
    }));

    setTouched((prev) => ({
      ...prev,
      caseType: true,
    }));

    const error = validateField("caseType", combinedType);
    setErrors((prev) => ({
      ...prev,
      caseType: error,
      courtName: validateField("courtName", newCourtName),
      courtType: validateField("courtType", newCourtType),
    }));
  };

  const handleSubtypeChange = (e) => {
    const sub = e.target.value;
    setSelectedSubtype(sub);

    const combinedType = selectedCategory && sub ? `${selectedCategory}: ${sub}` : "";
    
    // Auto-suggest Case Number prefix if caseNo is empty
    let autoCaseNo = formData.caseNo || "";
    if (sub && !formData.caseNo) {
      const codePart = sub.split("–")[0].split("-")[0].trim();
      const currentYear = new Date().getFullYear();
      autoCaseNo = `${codePart} 125/${currentYear}`;
    }

    setFormData((prev) => ({
      ...prev,
      caseType: combinedType,
      caseNo: autoCaseNo,
    }));

    setTouched((prev) => ({
      ...prev,
      caseType: true,
    }));

    const error = validateField("caseType", combinedType);
    setErrors((prev) => ({
      ...prev,
      caseType: error,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (clientMode === "") {
      alert("Please select New Client or Existing Client and fill the details.");
      return;
    }

    if (!validateAll()) return;

    const cnrUpper = (formData.cnrNumber || "").trim().toUpperCase();
    if (cnrUpper) {
      const cnrExists = (existingCases || []).some(
        (c) =>
          c.cnr_number &&
          c.cnr_number.trim().toUpperCase() === cnrUpper &&
          (!isEditMode || String(c.id) !== String(editId))
      );
      if (cnrExists) {
        setErrors((prev) => ({
          ...prev,
          cnrNumber: "A case with this CNR Number already exists.",
        }));
        setTouched((prev) => ({ ...prev, cnrNumber: true }));
        alert("This CNR Number is already registered with another case.");
        return;
      }
    }

    if (!isEditMode && clientMode === "new") {
      const emailLower = (formData.emailId || "").trim().toLowerCase();
      const emailExists = (existingClients || []).some(
        (c) => c.emailId && typeof c.emailId === "string" && c.emailId.trim().toLowerCase() === emailLower
      );
      if (emailExists) {
        setErrors((prev) => ({ ...prev, emailId: "This email is already associated with another client." }));
        setTouched((prev) => ({ ...prev, emailId: true }));
        alert("This email is already associated with another client.");
        return;
      }
      const emailExistsInUsers = (existingUsers || []).some(
        (u) => u.email && typeof u.email === "string" && u.email.trim().toLowerCase() === emailLower
      );
      if (emailExistsInUsers) {
        setErrors((prev) => ({ ...prev, emailId: "A user account with this email already exists." }));
        setTouched((prev) => ({ ...prev, emailId: true }));
        alert("A user account with this email already exists.");
        return;
      }
      const username = emailLower.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      const usernameExistsInUsers = (existingUsers || []).some(
        (u) => u.username && typeof u.username === "string" && u.username.trim().toLowerCase() === username
      );
      if (usernameExistsInUsers) {
        setErrors((prev) => ({ ...prev, emailId: "This email address generates a username that already exists in the system." }));
        setTouched((prev) => ({ ...prev, emailId: true }));
        alert("This email address generates a username that already exists in the system.");
        return;
      }
    }

    try {
      // 1. Process and upload any new files using FormData sequentially
      const processedDocs = [];
      for (const doc of documents) {
        const combinedType = doc.documentCategory && doc.documentType
          ? `${doc.documentCategory}: ${doc.documentType}`
          : doc.documentType || "";

        // If doc.file is an actual File object, we need to upload it
        if (doc.file && doc.file instanceof File) {
          const formDataObj = new FormData();
          formDataObj.append("file", doc.file);

          const uploadRes = await fetch(`${API_BASE_URL}/case-management/upload`, {
            method: "POST",
            body: formDataObj,
          });

          if (!uploadRes.ok) {
            alert(`Failed to upload document: ${doc.file.name}`);
            return;
          }

          const uploadData = await uploadRes.json();
          processedDocs.push({
            documentType: combinedType,
            advocate: selectedAdvocate || "",
            file: doc.file.name,
            url: uploadData.url,
            password: doc.password || "",
            uploadedAt: doc.uploadedAt || doc.uploaded_at || new Date().toISOString(),
            uploaded_at: doc.uploadedAt || doc.uploaded_at || new Date().toISOString(),
          });
        } else {
          // If doc.file is already uploaded previously (it won't be an instance of File), keep as-is
          processedDocs.push({
            documentType: combinedType,
            advocate: selectedAdvocate || "",
            file: doc.file ? doc.file.name : null,
            url: doc.url || null,
            password: doc.password || "",
            uploadedAt: doc.uploadedAt || doc.uploaded_at || new Date().toISOString(),
            uploaded_at: doc.uploadedAt || doc.uploaded_at || new Date().toISOString(),
          });
        }
      }

      const payload = {
        cnrNumber: formData.cnrNumber || null,
        caseId: formData.caseId || "",
        caseTitle: formData.caseTitle,
        caseNo: formData.caseNo,
        caseType: formData.caseType,
        caseDes: `Facts:\n${formData.facts || ""}`,

        clientName: formData.clientName,
        contactNumber: formData.contactNumber,
        emailId: formData.emailId,
        clientRole: formData.clientRole || "",
        clientAddress: formData.clientAddress || "",
        clientDistrict: formData.clientDistrict || "",

        courtName: formData.courtName,
        courtType: formData.courtType,

        status: formData.status,

        selectedAdvocate: selectedAdvocate || null,

        documents: processedDocs,
        nextHearingDate: formData.nextHearingDate || null,
      };

      const url = isEditMode
        ? `${API_BASE_URL}/case-management/${editId}`
        : `${API_BASE_URL}/case-management/`;

      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const detailMsg = errData?.detail || "Failed to save case";
        if (detailMsg.toLowerCase().includes("cnr number already exists")) {
          setErrors((prev) => ({
            ...prev,
            cnrNumber: "A case with this CNR Number already exists.",
          }));
          setTouched((prev) => ({ ...prev, cnrNumber: true }));
          alert("A case with this CNR Number already exists in the system. Please use a unique CNR Number.");
          return;
        }
        alert(detailMsg);
        return;
      }

      // Provision user if New Client mode and tempPassword is provided
      if (!isEditMode && clientMode === "new" && formData.tempPassword) {
        const nameParts = formData.clientName.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        const username = formData.emailId.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");

        try {
          const provRes = await fetch(`${API_BASE_URL}/permissions/users/provision`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              firstName,
              lastName,
              phone: formData.contactNumber,
              username,
              email: formData.emailId,
              role: "client",
              tempPassword: formData.tempPassword,
            }),
          });
          if (!provRes.ok) {
            const errData = await provRes.json().catch(() => null);
            console.error("User provisioning failed:", errData?.detail);
            alert("Error: Case was saved, but client user account could not be created: " + (errData?.detail || "Unknown error"));
          }
        } catch (provErr) {
          console.error("Connection error while provisioning user:", provErr);
          alert("Error: Case was saved, but client user account could not be created due to connection issue.");
        }
      }

      setShowSuccessPopup(true);

      setTimeout(() => {
        setShowSuccessPopup(false);
        router.push("/case-management");
      }, 2500);

      // Reset form only for add mode
      if (!isEditMode) {
        setFormData({
          cnrNumber: "",
          caseId: "",
          caseTitle: "",
          caseNo: "",
          caseType: "",
          caseCat: "",
          caseDes: "",
          clientRole: "",
          clientName: "",
          contactNumber: "",
          emailId: "",
          clientAddress: "",
          clientDistrict: "",
          courtName: "",
          courtType: "",
          status: "Active",
          nextHearingDate: "",
        });

        setErrors({});
        setTouched({});
        setDocuments([
          {
            documentCategory: "",
            documentType: "",
            advocate: "",
            file: null,
          },
        ]);

        setSelectedAdvocate("");
        setClientMode("");
        setSelectedCategory("");
        setSelectedSubtype("");
        
      }
    } catch (error) {
      alert("Something went wrong while saving the case.");
    }
  };

  if (loadingEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#64748B] font-medium">Loading case data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ===== SUCCESS POPUP ===== */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle size={36} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-1">
              {isEditMode ? "Case Updated Successfully!" : "Case Saved Successfully!"}
            </h3>
            <p className="text-sm text-[#64748B] mb-5">
              {isEditMode
                ? "Your case has been updated. Redirecting..."
                : "Your case file has been created and saved. Redirecting..."}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-green-500 h-full rounded-full animate-[progressBar_2.5s_linear_forwards]" />
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl mx-auto bg-white p-6 md:p-8 rounded-xl border border-[#E2E8F0] shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => router.push("/case-management")}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              {isEditMode && (
                <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                  <Edit3 size={12} /> Edit Mode
                </span>
              )}
              <h2 className="text-2xl font-bold">
                {isEditMode ? "Edit Case" : "Add New Case"}
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              {isEditMode
                ? "Update the case details below."
                : "Create a new case file and upload initial documentation."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Client Information */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider">Client Details</h3>
              <div className="flex bg-[#F1F5F9] rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => {
                    setClientMode("new");
                    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
                    let password = "temp_";
                    for (let i = 0; i < 8; i++) {
                      password += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    setFormData(prev => ({ ...prev, clientName: "", contactNumber: "", emailId: "", tempPassword: password }));
                    setErrors(prev => ({ ...prev, clientName: "", contactNumber: "", emailId: "", tempPassword: "" }));
                    setTouched(prev => ({ ...prev, clientName: false, contactNumber: false, emailId: false, tempPassword: false }));
                  }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${clientMode === "new" ? "bg-white text-[#2563EB] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"}`}
                >
                  New Client
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClientMode("existing");
                    setFormData(prev => ({ ...prev, clientName: "", contactNumber: "", emailId: "", tempPassword: "" }));
                    setErrors(prev => ({ ...prev, clientName: "", contactNumber: "", emailId: "", tempPassword: "" }));
                    setTouched(prev => ({ ...prev, clientName: false, contactNumber: false, emailId: false, tempPassword: false }));
                  }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${clientMode === "existing" ? "bg-white text-[#2563EB] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"}`}
                >
                  Existing Client
                </button>
              </div>
            </div>

            {clientMode !== "" && (
              <div className="space-y-5">
                {/* Main Client Fields Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">Client Name</label>
                    </div>
                    {clientMode === "existing" ? (
                      <select
                        name="clientName"
                        value={formData.clientName}
                        onChange={handleExistingClientChange}
                        className={`${baseInputClass} ${getBorderClass("clientName")}`}
                      >
                        <option value="">— Select Client —</option>
                        {existingClients.map((c, i) => (
                          <option key={i} value={c.clientName}>
                            {c.clientName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        name="clientName"
                        placeholder="Full Name"
                        value={formData.clientName}
                        onChange={handleChange}
                        className={`${baseInputClass} ${getBorderClass("clientName")}`}
                      />
                    )}
                    {touched.clientName && errors.clientName && <ErrorMsg message={errors.clientName} />}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">Contact Number</label>
                    </div>
                    <input type="tel" name="contactNumber" placeholder="e.g. 9876543210" value={formData.contactNumber} onChange={handleChange}
                      readOnly={clientMode === "existing"}
                      className={`${baseInputClass} ${getBorderClass("contactNumber")} ${clientMode === "existing" ? "bg-gray-50" : ""}`} />
                    {touched.contactNumber && errors.contactNumber && <ErrorMsg message={errors.contactNumber} />}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">Email Address</label>
                    </div>
                    <input type="email" name="emailId" placeholder="client@example.com" value={formData.emailId} onChange={handleChange}
                      readOnly={clientMode === "existing"}
                      className={`${baseInputClass} ${getBorderClass("emailId")} ${clientMode === "existing" ? "bg-gray-50" : ""}`} />
                    {touched.emailId && errors.emailId && <ErrorMsg message={errors.emailId} />}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">Client Role</label>
                    </div>
                    <select
                      name="clientRole"
                      value={formData.clientRole}
                      onChange={handleChange}
                      className={`${baseInputClass} ${getBorderClass("clientRole")}`}
                    >
                      <option value="">Select Role</option>
                      <option value="Petitioner">Petitioner</option>
                      <option value="Respondent">Respondent</option>
                    </select>
                    {touched.clientRole && errors.clientRole && <ErrorMsg message={errors.clientRole} />}
                  </div>
                </div>

                {/* Address and District Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">Client Address</label>
                    </div>
                    <input
                      type="text"
                      name="clientAddress"
                      placeholder="House No, Street, City"
                      value={formData.clientAddress || ""}
                      onChange={handleChange}
                      readOnly={clientMode === "existing"}
                      className={`${baseInputClass} ${getBorderClass("clientAddress")} ${clientMode === "existing" ? "bg-gray-50" : ""}`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">Client District / Location</label>
                    </div>
                    <select
                      name="clientDistrict"
                      value={formData.clientDistrict || ""}
                      onChange={handleChange}
                      className={`${baseInputClass} ${getBorderClass("clientDistrict")}`}
                    >
                      <option value="">Select District / Location</option>
                      {Object.keys(DISTRICT_COURTS).map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password Row (only for new client mode) */}
                {clientMode === "new" && !isEditMode && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">Temporary Password</label>
                        <button
                          type="button"
                          onClick={() => {
                            const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
                            let password = "temp_";
                            for (let i = 0; i < 8; i++) {
                              password += chars.charAt(Math.floor(Math.random() * chars.length));
                            }
                            setFormData(prev => ({ ...prev, tempPassword: password }));
                            setErrors(prev => ({ ...prev, tempPassword: "" }));
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                        >
                          Generate Password
                        </button>
                      </div>
                      <input
                        type="text"
                        name="tempPassword"
                        placeholder="e.g. TempPass123"
                        value={formData.tempPassword || ""}
                        onChange={handleChange}
                        className={`${baseInputClass} ${getBorderClass("tempPassword")}`}
                      />
                      {touched.tempPassword && errors.tempPassword && <ErrorMsg message={errors.tempPassword} />}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {clientMode === "" && (
              <div className="py-8 text-center border-2 border-dashed border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
                <p className="text-sm text-[#64748B] font-medium">Please select New Client or Existing Client to proceed.</p>
              </div>
            )}
          </div>

          {/* Case Details */}
          <div className="space-y-5 pt-4 border-t border-[#F1F5F9]">
            <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider">
              Case Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Case Title */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Case Name</label>
                <input
                  type="text"
                  name="caseTitle"
                  placeholder="e.g. State vs. John Doe"
                  value={formData.caseTitle}
                  onChange={handleChange}
                  className={`${baseInputClass} ${getBorderClass("caseTitle")}`}
                />
                {touched.caseTitle && errors.caseTitle && <ErrorMsg message={errors.caseTitle} />}
              </div>

              {/* CNR Number */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">CNR Number</label>
                  <button
                    type="button"
                    onClick={handleFetchFromECourts}
                    disabled={ecourtsLoading}
                    className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-blue-200"
                  >
                    {ecourtsLoading ? "Fetching..." : "✨ Fetch from eCourts"}
                  </button>
                </div>
                <input
                  type="text"
                  name="cnrNumber"
                  placeholder="e.g. KLAL010012342026"
                  value={formData.cnrNumber || ""}
                  onChange={handleChange}
                  className={`${baseInputClass} ${getBorderClass("cnrNumber")}`}
                />
                {touched.cnrNumber && errors.cnrNumber && <ErrorMsg message={errors.cnrNumber} />}
              </div>

              {/* Case Category */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Case Category</label>
                <select
                  name="caseCategory"
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className={`${baseInputClass} ${getBorderClass("caseType")}`}
                >
                  <option value="">Select Category</option>
                  {Object.keys(keralaCaseCategories).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {touched.caseType && errors.caseType && !selectedCategory && <ErrorMsg message={errors.caseType} />}
              </div>

              {/* Case Subtype */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Case Subtype / Type</label>
                <select
                  name="caseSubtype"
                  value={selectedSubtype}
                  onChange={handleSubtypeChange}
                  disabled={!selectedCategory}
                  className={`${baseInputClass} ${getBorderClass("caseType")} ${!selectedCategory ? "bg-slate-50 cursor-not-allowed" : ""}`}
                >
                  <option value="">Select Subtype</option>
                  {selectedCategory &&
                    (keralaCaseCategories[selectedCategory] || []).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                </select>
                {touched.caseType && errors.caseType && selectedCategory && <ErrorMsg message={errors.caseType} />}
              </div>

              {/* Case Number */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Case Number</label>
                <input
                  type="text"
                  name="caseNo"
                  placeholder="e.g. OS 125/2025"
                  value={formData.caseNo || ""}
                  onChange={handleChange}
                  className={`${baseInputClass} ${getBorderClass("caseNo")}`}
                />
                {touched.caseNo && errors.caseNo && <ErrorMsg message={errors.caseNo} />}
              </div>

              {/* Case ID — auto-generated */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">Case ID</label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Auto</span>
                </div>
                <input
                  type="text"
                  name="caseId"
                  value={formData.caseId || ""}
                  readOnly
                  className={`${baseInputClass} bg-slate-50 text-[#475569] cursor-not-allowed border-[#E2E8F0]`}
                />
              </div>

              {/* Current Date */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                  Date
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString("en-GB")}
                  readOnly
                  className={`${baseInputClass} bg-slate-50 text-[#475569] cursor-not-allowed border-[#E2E8F0]`}
                />
              </div>
            </div>



            {/* Facts (Full Width) */}
            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Facts *</label>
              <textarea
                name="facts"
                placeholder="Provide facts of the case..."
                value={formData.facts || ""}
                onChange={handleChange}
                className={`${baseInputClass} ${getBorderClass("facts")} resize-y`}
                rows="6"
              />
              {touched.facts && errors.facts && <ErrorMsg message={errors.facts} />}
            </div>
          </div>



          {/* Court Information */}
          <div className="space-y-5 pt-4 border-t border-[#F1F5F9]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider">Court Details</h3>
              <div className="flex flex-wrap items-center gap-2">
                {formData.clientDistrict && (
                  <span className="text-xs font-semibold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    Location: {formData.clientDistrict}
                  </span>
                )}
                {selectedCategory && (
                  <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                    Category: {selectedCategory}
                  </span>
                )}
                {canFilterByCategory && !showAllCourts && (
                  <button
                    type="button"
                    onClick={() => setShowAllCourts(true)}
                    className="text-xs font-bold text-[#64748B] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full transition cursor-pointer border border-slate-200"
                  >
                    Show All Courts
                  </button>
                )}
                {canFilterByCategory && showAllCourts && (
                  <button
                    type="button"
                    onClick={() => setShowAllCourts(false)}
                    className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition cursor-pointer border border-blue-200"
                  >
                    Filter by Category
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Court Name</label>
                <select name="courtName" value={formData.courtName} onChange={handleChange}
                  className={`${baseInputClass} ${getBorderClass("courtName")}`}>
                  <option value="">Select Court Name</option>
                  {(availableCourts || []).map((court, idx) => (
                    <option key={idx} value={court}>{court}</option>
                  ))}
                </select>
                {touched.courtName && errors.courtName && <ErrorMsg message={errors.courtName} />}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Court Type</label>
                <select name="courtType" value={formData.courtType} onChange={handleChange}
                  className={`${baseInputClass} ${getBorderClass("courtType")}`}>
                  <option value="">Select Court Type</option>
                  {(getTypesForCourtName(formData.courtName) || []).map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {touched.courtType && errors.courtType && <ErrorMsg message={errors.courtType} />}
              </div>
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="space-y-6 pt-4 border-t border-[#F1F5F9]">
            <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider">Document Upload</h3>


            {/* Document rows */}
            {documents.map((doc, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border border-[#E2E8F0] p-5 rounded-2xl bg-[#F8FAFC]"
              >
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Document Category</label>
                  <select
                    value={doc.documentCategory || ""}
                    onChange={(e) => {
                      const updated = [...documents];
                      updated[index].documentCategory = e.target.value;
                      updated[index].documentType = "";
                      setDocuments(updated);
                    }}
                    className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="">Select Category</option>
                    {Object.keys(documentCategories).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                    {doc.documentCategory === "Affidavits" ? "Affidavit Type" : "Document Type"}
                  </label>
                  <select
                    value={doc.documentType || ""}
                    onChange={(e) => {
                      const updated = [...documents];
                      updated[index].documentType = e.target.value;
                      setDocuments(updated);
                    }}
                    disabled={!doc.documentCategory}
                    className={`w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm ${!doc.documentCategory ? "bg-slate-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">
                      {doc.documentCategory === "Affidavits" ? "Select Affidavit Type" : "Select Document Type"}
                    </option>
                    {doc.documentCategory &&
                      documentCategories[doc.documentCategory]?.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Upload File</label>
                  <div className="flex items-center gap-2">
                    <input
                      id={`file-upload-${index}`}
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setDocuments((prev) => {
                            const updated = [...prev];
                            if (updated[index]) {
                              updated[index].file = file;
                              updated[index].url = null; // Will upload on submit
                            }
                            return updated;
                          });
                        } else {
                          const updated = [...documents];
                          updated[index].file = null;
                          updated[index].url = null;
                          setDocuments(updated);
                        }
                      }}
                      className="hidden"
                    />
                    {doc.file ? (
                      <div className="flex items-center justify-between w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm h-10">
                        <span className="text-[#0F172A] font-medium truncate max-w-[180px]">
                          {doc.file.name}
                        </span>
                        <label
                          htmlFor={`file-upload-${index}`}
                          className="text-xs text-[#2563EB] hover:text-[#1d4ed8] font-semibold hover:underline cursor-pointer"
                        >
                          Change
                        </label>
                      </div>
                    ) : (
                      <label
                        htmlFor={`file-upload-${index}`}
                        className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-dashed border-[#E2E8F0] hover:border-[#2563EB] bg-white px-3 py-2 text-sm text-[#64748B] hover:text-[#2563EB] cursor-pointer transition-all duration-200"
                      >
                        Choose File
                      </label>
                    )}
                    {doc.file && (
                      <button
                        type="button"
                        onClick={() => {
                          if (doc.url) {
                            if (doc.url.startsWith("data:")) {
                              try {
                                const parts = doc.url.split(",");
                                const mime = parts[0].match(/:(.*?);/)[1];
                                const bstr = atob(parts[1]);
                                let n = bstr.length;
                                const u8arr = new Uint8Array(n);
                                while (n--) {
                                  u8arr[n] = bstr.charCodeAt(n);
                                }
                                const blob = new Blob([u8arr], { type: mime });
                                const blobUrl = URL.createObjectURL(blob);
                                window.open(blobUrl, "_blank");
                              } catch (e) {
                                console.error("Failed to preview base64:", e);
                                window.open(doc.url, "_blank");
                              }
                            } else {
                              window.open(doc.url, "_blank");
                            }
                          } else if (doc.file instanceof File) {
                            window.open(URL.createObjectURL(doc.file), "_blank");
                          } else {
                            alert("No preview data available for this document.");
                          }
                        }}
                        className="p-3 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition"
                      >
                        <Eye size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDocuments([...documents, { documentCategory: "", documentType: "", file: null }])
                    }
                    className="bg-[#2563EB] text-white px-4 py-2 rounded-lg hover:bg-[#1d4ed8] transition"
                  >
                    +
                  </button>
                  {documents.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDocuments(documents.filter((_, i) => i !== index))
                      }
                      className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={() => router.push("/case-management")}
              className="px-6 py-3.5 rounded-lg font-medium text-sm border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-8 py-3.5 rounded-lg font-medium text-sm shadow-sm transition-all duration-200 cursor-pointer"
            >
              {isEditMode ? "Update Case" : "Save Case File"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}