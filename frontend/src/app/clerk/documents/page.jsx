"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/utils/api";
import { getLoggedInUser } from "@/utils/auth";
import OCRPanel from "@/views/UI/CaseManagement/OCRPanel";
import DocumentViewerModal from "@/components/common/DocumentViewerModal";
import {
  ArrowLeft,
  FileText,
  FolderOpen,
  UserCheck,
  Send,
  Eye,
  EyeOff,
  CheckCircle,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Folder,
  X,
  Plus,
  UploadCloud,
  Search,
  Building2,
  User,
  Calendar,
  RotateCcw,
  ShieldCheck
} from "lucide-react";

// Status Badge Helper
function StatusBadge({ status }) {
  const rawStatus = status || "Active";
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
      <CheckCircle size={12} />
      {rawStatus}
    </span>
  );
}

function ClerkDocumentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCaseId = searchParams ? (searchParams.get("id") || searchParams.get("caseId")) : null;

  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [caseLoading, setCaseLoading] = useState(false);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState("all"); // "all", "week", "month", "year"
  const [customDate, setCustomDate] = useState("");

  // Pagination State (7 items per page)
  const ITEMS_PER_PAGE = 7;
  const [currentPage, setCurrentPage] = useState(1);

  // Advocate assignment states (Primary & Standby/Backup)
  const [advocates, setAdvocates] = useState([]);
  const [assignedAdvocate, setAssignedAdvocate] = useState("");
  const [standbyAdvocate, setStandbyAdvocate] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  // Document states
  const [showPasswordIdx, setShowPasswordIdx] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [docAssignModal, setDocAssignModal] = useState(null);
  const [docAssignAdvocate, setDocAssignAdvocate] = useState("");
  const [docAssignLoading, setDocAssignLoading] = useState(false);
  const [docAssignedSet, setDocAssignedSet] = useState(new Set());
  const [docPinError, setDocPinError] = useState(null); // idx of doc missing PIN

  // Success Confirmation Modal State
  const [successMessage, setSuccessMessage] = useState("");

  // Add Document Modal State
  const [addDocModalOpen, setAddDocModalOpen] = useState(false);
  const [newDocFile, setNewDocFile] = useState(null);
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState("Counter Affidavit");
  const [newDocPin, setNewDocPin] = useState("");
  const [addDocLoading, setAddDocLoading] = useState(false);

  // Add Case Modal State
  const [addCaseModalOpen, setAddCaseModalOpen] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState("");
  const [newCaseNo, setNewCaseNo] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newContactNo, setNewContactNo] = useState("");
  const [newEmailId, setNewEmailId] = useState("");
  const [newCaseType, setNewCaseType] = useState("Civil");
  const [newCourtName, setNewCourtName] = useState("Munsiff Court Ernakulam");
  const [newCourtType, setNewCourtType] = useState("Munsiff Court");
  const [newNextHearingDate, setNewNextHearingDate] = useState("");
  const [newCaseStatus, setNewCaseStatus] = useState("Active");
  const [newCaseDescription, setNewCaseDescription] = useState("");
  const [addCaseLoading, setAddCaseLoading] = useState(false);

  // Add Case Submit Handler
  const handleAddCaseSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newCaseTitle.trim()) {
      alert("Please enter a Case Title.");
      return;
    }
    setAddCaseLoading(true);
    try {
      const generatedCaseId = newCaseNo.trim() || `CASE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const payload = {
        caseId: generatedCaseId,
        cnrNumber: `CNR${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
        caseTitle: newCaseTitle.trim(),
        caseNo: newCaseNo.trim() || generatedCaseId,
        caseType: newCaseType,
        caseDes: newCaseDescription.trim() || "Case created by Clerk",
        clientName: newClientName.trim() || "Client",
        contactNumber: newContactNo.trim() || "",
        emailId: newEmailId.trim() || "",
        courtName: newCourtName.trim() || "Munsiff Court Ernakulam",
        courtType: newCourtType || "Munsiff Court",
        status: newCaseStatus || "Active",
        selectedAdvocate: "",
        documents: [],
        nextHearingDate: newNextHearingDate || new Date().toISOString().split("T")[0]
      };

      const res = await fetch(`${API_BASE_URL}/case-management/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to create new case.");

      // Reset form fields
      setNewCaseTitle("");
      setNewCaseNo("");
      setNewClientName("");
      setNewContactNo("");
      setNewEmailId("");
      setNewCaseDescription("");
      setNewNextHearingDate("");
      setAddCaseModalOpen(false);

      // Refresh cases list table
      await fetchCases();

      setSuccessMessage(`New Case "${payload.caseTitle}" has been created successfully.`);
    } catch (err) {
      console.error("Add Case error:", err);
      alert(err.message || "Failed to create new case.");
    } finally {
      setAddCaseLoading(false);
    }
  };

  // Derived list of advocates assigned specifically to this case
  const caseAssignedAdvocates = Array.from(
    new Set([assignedAdvocate, standbyAdvocate].filter(Boolean))
  );

  // Fetch all cases
  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/case-management/`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setCases(list);

        // If URL had queryCaseId, select it automatically
        if (queryCaseId && list.length > 0) {
          const match = list.find((c) => String(c.id) === String(queryCaseId));
          if (match) setSelectedCase(match);
        }
      }
    } catch (err) {
      console.error("Error fetching cases for clerk:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [queryCaseId]);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterBy, customDate]);

  // Fetch all advocate users in the law firm
  useEffect(() => {
    const fetchAdvocates = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/permissions/users`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : [];
          // Filter advocates (junior, advocate, senior, lawyer)
          const filtered = list.filter((u) => {
            const role = (u.role || "").toLowerCase();
            return role.includes("junior") || role.includes("advocate") || role.includes("lawyer");
          });
          setAdvocates(filtered.length > 0 ? filtered : list);
        }
      } catch (e) {
        console.error("Failed to fetch advocates:", e);
      }
    };
    fetchAdvocates();
  }, []);

  // Fetch single case details and assigned advocate info when selectedCase changes
  const fetchCaseDetails = async (id) => {
    if (!id) return;
    setCaseLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/case-management/${id}`);
      if (res.ok) {
        const rawCase = await res.json();
        setSelectedCase(rawCase);
        setAssignedAdvocate(rawCase.selected_advocate || rawCase.selectedAdvocate || "");

        // Check assigned cases for Primary & Standby Advocate names
        try {
          const assignedRes = await fetch(`${API_BASE_URL}/lawfirm-management/assigned-cases`);
          if (assignedRes.ok) {
            const assignedCases = await assignedRes.json();
            const match = assignedCases.find(
              ac => String(ac.case_id) === String(rawCase.id) || String(ac.case_number) === String(rawCase.case_no)
            );
            if (match) {
              if (match.advocate_name || match.advocateName) {
                setAssignedAdvocate(match.advocate_name || match.advocateName);
              }
              setStandbyAdvocate(match.secondary_advocate_name || match.secondaryAdvocateName || "");
            } else {
              setStandbyAdvocate("");
            }
          }
        } catch (e) {
          console.warn("Could not fetch assigned case details:", e);
        }
      }
    } catch (err) {
      console.error("Error fetching case details:", err);
    } finally {
      setCaseLoading(false);
    }
  };

  const handleSelectCaseToView = (c) => {
    fetchCaseDetails(c.id);
  };

  // Filter cases with Text Search & Filter By Dropdown + Calendar Date Picker
  const filteredCases = cases.filter((c) => {
    // 1. Text search query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const title = (c.case_title || "").toLowerCase();
      const caseNo = (c.case_no || c.case_id || "").toLowerCase();
      const client = (c.client_name || "").toLowerCase();
      const court = (c.court_name || "").toLowerCase();
      if (!title.includes(q) && !caseNo.includes(q) && !client.includes(q) && !court.includes(q)) {
        return false;
      }
    }

    // Date Parsing Helper
    const rawDateStr = c.created_at || c.next_hearing_date || c.filing_date;
    const dateObj = rawDateStr ? new Date(rawDateStr) : null;
    const validDate = dateObj && !isNaN(dateObj.getTime());

    // 2. Custom Calendar Date Filter (YYYY-MM-DD)
    if (customDate) {
      if (validDate) {
        const formattedDate = dateObj.toISOString().split("T")[0];
        if (formattedDate !== customDate) return false;
      }
    }

    // 3. Filter By Dropdown ("all", "week", "month", "year")
    if (filterBy !== "all") {
      const now = new Date();
      if (filterBy === "week") {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (!validDate || dateObj < oneWeekAgo) return false;
      } else if (filterBy === "month") {
        if (!validDate || dateObj.getMonth() !== now.getMonth() || dateObj.getFullYear() !== now.getFullYear()) return false;
      } else if (filterBy === "year") {
        if (!validDate || dateObj.getFullYear() !== now.getFullYear()) return false;
      }
    }

    return true;
  });

  // Calculate Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredCases.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredCases.length);
  const paginatedCases = filteredCases.slice(startIndex, endIndex);

  const isAnyFilterActive = filterBy !== "all" || customDate !== "" || searchQuery !== "";

  const handleResetFilters = () => {
    setFilterBy("all");
    setCustomDate("");
    setSearchQuery("");
  };

  // Add Document Submit Handler
  const handleAddDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCase || !newDocFile) {
      alert("Please select a file to upload.");
      return;
    }

    setAddDocLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileBase64 = event.target.result;
        const fileNameToUse = newDocName.trim() || newDocFile.name;

        const newDocObj = {
          documentType: newDocType || "Other",
          advocate: getLoggedInUser()?.username || selectedCase.selected_advocate || "Clerk",
          file: fileNameToUse,
          url: fileBase64,
          password: newDocPin ? newDocPin.trim() : ""
        };

        const updatedDocuments = [...(selectedCase.documents || []), newDocObj];

        const res = await fetch(`${API_BASE_URL}/case-management/${selectedCase.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId: selectedCase.case_id,
            cnrNumber: selectedCase.cnr_number,
            caseTitle: selectedCase.case_title,
            caseNo: selectedCase.case_no,
            caseType: selectedCase.case_type,
            caseDes: selectedCase.case_description,
            clientName: selectedCase.client_name,
            contactNumber: selectedCase.contact_number,
            emailId: selectedCase.email_id,
            courtName: selectedCase.court_name,
            courtType: selectedCase.court_type,
            status: selectedCase.status,
            selectedAdvocate: selectedCase.selected_advocate,
            documents: updatedDocuments,
            nextHearingDate: selectedCase.next_hearing_date
          })
        });

        if (!res.ok) throw new Error("Failed to add document to case.");

        setSelectedCase(prev => ({
          ...prev,
          documents: updatedDocuments
        }));

        fetchCases();
        setAddDocModalOpen(false);
        setNewDocFile(null);
        setNewDocName("");
        setNewDocPin("");
        setNewDocType("Counter Affidavit");
        setSuccessMessage(`Document "${fileNameToUse}" has been uploaded successfully.`);
      };

      reader.readAsDataURL(newDocFile);
    } catch (err) {
      console.error("Add Document error:", err);
      alert(err.message || "Failed to add document.");
    } finally {
      setAddDocLoading(false);
    }
  };

  // Handle saving OCR output to Case Documents
  const handleSaveOcrToCaseDocuments = async (extractedText, originalFilename, detectedDocType, digitizedHtml) => {
    if (!selectedCase || (!extractedText && !digitizedHtml)) return;
    try {
      const cleanName = (originalFilename || "Document").replace(/\.[^/.]+$/, "");
      let docName = "";
      let textBase64 = "";

      if (typeof extractedText === "string" && extractedText.startsWith("data:")) {
        const isPdf = extractedText.includes("pdf");
        const ext = isPdf ? "pdf" : "png";
        docName = `Scanned_${cleanName.replace(/[^a-zA-Z0-9_]/g, "_")}.${ext}`;
        textBase64 = extractedText;
      } else {
        const contentToSave = digitizedHtml || extractedText;
        const ext = digitizedHtml ? "html" : "txt";
        const mime = digitizedHtml ? "text/html" : "text/plain";
        docName = `OCR_${cleanName.replace(/[^a-zA-Z0-9_]/g, "_")}.${ext}`;
        textBase64 = `data:${mime};charset=utf-8;base64,${btoa(unescape(encodeURIComponent(contentToSave)))}`;
      }

      const newDocObj = {
        documentType: detectedDocType || "Scanned Document",
        advocate: getLoggedInUser()?.username || selectedCase.selected_advocate || "Advocate",
        file: docName,
        url: textBase64,
        password: ""
      };

      const updatedDocuments = [...(selectedCase.documents || []), newDocObj];

      const res = await fetch(`${API_BASE_URL}/case-management/${selectedCase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: selectedCase.case_id,
          cnrNumber: selectedCase.cnr_number,
          caseTitle: selectedCase.case_title,
          caseNo: selectedCase.case_no,
          caseType: selectedCase.case_type,
          caseDes: selectedCase.case_description,
          clientName: selectedCase.client_name,
          contactNumber: selectedCase.contact_number,
          emailId: selectedCase.email_id,
          courtName: selectedCase.court_name,
          courtType: selectedCase.court_type,
          status: selectedCase.status,
          selectedAdvocate: selectedCase.selected_advocate,
          documents: updatedDocuments,
          nextHearingDate: selectedCase.next_hearing_date
        })
      });

      if (!res.ok) throw new Error("Failed to save OCR document to case files.");

      setSelectedCase(prev => ({
        ...prev,
        documents: updatedDocuments
      }));
      fetchCases();
      setSuccessMessage(`OCR Document "${docName}" has been saved successfully.`);
    } catch (err) {
      console.error("Save OCR Document error:", err);
      alert(err.message || "Failed to save OCR document.");
    }
  };

  // Handle deleting document
  const handleDeleteCaseDocument = async (docIndex) => {
    if (!selectedCase || !selectedCase.documents) return;
    const docToDelete = selectedCase.documents[docIndex];
    if (!window.confirm(`Are you sure you want to delete "${docToDelete?.file || "this document"}"?`)) return;

    try {
      const updatedDocuments = selectedCase.documents.filter((_, i) => i !== docIndex);

      const res = await fetch(`${API_BASE_URL}/case-management/${selectedCase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: selectedCase.case_id,
          cnrNumber: selectedCase.cnr_number,
          caseTitle: selectedCase.case_title,
          caseNo: selectedCase.case_no,
          caseType: selectedCase.case_type,
          caseDes: selectedCase.case_description,
          clientName: selectedCase.client_name,
          contactNumber: selectedCase.contact_number,
          emailId: selectedCase.email_id,
          courtName: selectedCase.court_name,
          courtType: selectedCase.court_type,
          status: selectedCase.status,
          selectedAdvocate: selectedCase.selected_advocate,
          documents: updatedDocuments,
          nextHearingDate: selectedCase.next_hearing_date
        })
      });

      if (!res.ok) throw new Error("Failed to delete document.");

      setSelectedCase(prev => ({
        ...prev,
        documents: updatedDocuments
      }));
      fetchCases();
      setSuccessMessage(`Document deleted successfully.`);
    } catch (err) {
      console.error("Delete document error:", err);
      alert(err.message || "Failed to delete document.");
    }
  };

  // Handle 6-digit PIN password change for a document
  const handleDocPasswordChange = async (docIndex, newPassword) => {
    if (!selectedCase || !selectedCase.documents) return;
    const updatedDocs = [...selectedCase.documents];
    updatedDocs[docIndex] = {
      ...updatedDocs[docIndex],
      password: newPassword
    };

    setSelectedCase(prev => ({ ...prev, documents: updatedDocs }));

    if (newPassword === "" || newPassword.length === 6) {
      try {
        await fetch(`${API_BASE_URL}/case-management/${selectedCase.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId: selectedCase.case_id,
            cnrNumber: selectedCase.cnr_number,
            caseTitle: selectedCase.case_title,
            caseNo: selectedCase.case_no,
            caseType: selectedCase.case_type,
            caseDes: selectedCase.case_description,
            clientName: selectedCase.client_name,
            contactNumber: selectedCase.contact_number,
            emailId: selectedCase.email_id,
            courtName: selectedCase.court_name,
            courtType: selectedCase.court_type,
            status: selectedCase.status,
            selectedAdvocate: selectedCase.selected_advocate || "",
            documents: updatedDocs,
            nextHearingDate: selectedCase.next_hearing_date
          })
        });
      } catch (err) {
        console.error("Failed to update document password PIN:", err);
      }
    }
  };

  // Save Primary Advocate & Standby Advocate assignment
  const handleAssignDocument = async () => {
    if (!assignedAdvocate || !selectedCase) {
      alert("Please select a Primary Advocate.");
      return;
    }
    setAssignLoading(true);
    try {
      // Check if an assigned case record already exists in lawfirm-management
      let existingRecordId = null;
      try {
        const assignedRes = await fetch(`${API_BASE_URL}/lawfirm-management/assigned-cases`);
        if (assignedRes.ok) {
          const assignedCases = await assignedRes.json();
          const match = assignedCases.find(
            ac => String(ac.case_id) === String(selectedCase.id) || String(ac.case_number) === String(selectedCase.case_no)
          );
          if (match) existingRecordId = match.id;
        }
      } catch (e) {}

      const payload = {
        case_id: selectedCase.id,
        case_name: selectedCase.case_title,
        case_number: selectedCase.case_no,
        case_title: selectedCase.case_title,
        advocate_name: assignedAdvocate,
        secondary_advocate_name: standbyAdvocate || "",
        secondaryAdvocateName: standbyAdvocate || "",
        practice_area: selectedCase.case_type || "",
        priority: "Normal",
        due_date: selectedCase.next_hearing_date || "",
        assignment_notes: `Assigned by Clerk - Case #${selectedCase.case_no}`,
        status: "Active",
        assigned_documents: selectedCase.documents || [],
        client_name: selectedCase.client_name || ""
      };

      if (existingRecordId) {
        await fetch(`${API_BASE_URL}/lawfirm-management/assigned-cases/${existingRecordId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(`${API_BASE_URL}/lawfirm-management/assign-case`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      // Update case_management record selected_advocate
      await fetch(`${API_BASE_URL}/case-management/${selectedCase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: selectedCase.case_id,
          cnrNumber: selectedCase.cnr_number,
          caseTitle: selectedCase.case_title,
          caseNo: selectedCase.case_no,
          caseType: selectedCase.case_type,
          caseDes: selectedCase.case_description,
          clientName: selectedCase.client_name,
          contactNumber: selectedCase.contact_number,
          emailId: selectedCase.email_id,
          courtName: selectedCase.court_name,
          courtType: selectedCase.court_type,
          status: selectedCase.status,
          selectedAdvocate: assignedAdvocate,
          documents: selectedCase.documents || [],
          nextHearingDate: selectedCase.next_hearing_date
        })
      });

      setSelectedCase(prev => ({
        ...prev,
        selected_advocate: assignedAdvocate
      }));

      setSuccessMessage(`Advocate assignment saved successfully!`);
    } catch (e) {
      console.error(e);
      alert("Failed to save advocate assignment.");
    } finally {
      setAssignLoading(false);
    }
  };

  // Remove/Unassign advocate from whole case
  const handleUnassignAdvocate = async () => {
    if (!selectedCase) return;
    try {
      // 1. Delete assignment record from lawfirm-management/assigned-cases
      try {
        const assignedRes = await fetch(`${API_BASE_URL}/lawfirm-management/assigned-cases`);
        if (assignedRes.ok) {
          const assignedCases = await assignedRes.json();
          const matches = assignedCases.filter(
            ac => String(ac.case_id) === String(selectedCase.id) || String(ac.case_number) === String(selectedCase.case_no)
          );
          for (const match of matches) {
            await fetch(`${API_BASE_URL}/lawfirm-management/assigned-cases/${match.id}`, {
              method: "DELETE"
            });
          }
        }
      } catch (err) {
        console.warn("Could not remove assigned case record:", err);
      }

      // 2. Clear selectedAdvocate on the case
      await fetch(`${API_BASE_URL}/case-management/${selectedCase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: selectedCase.case_id,
          cnrNumber: selectedCase.cnr_number,
          caseTitle: selectedCase.case_title,
          caseNo: selectedCase.case_no,
          caseType: selectedCase.case_type,
          caseDes: selectedCase.case_description,
          clientName: selectedCase.client_name,
          contactNumber: selectedCase.contact_number,
          emailId: selectedCase.email_id,
          courtName: selectedCase.court_name,
          courtType: selectedCase.court_type,
          status: selectedCase.status,
          selectedAdvocate: "",
          documents: selectedCase.documents || [],
          nextHearingDate: selectedCase.next_hearing_date
        })
      });
    } catch (err) {
      console.error("Error during advocate unassignment:", err);
    } finally {
      // 3. Reset local states cleanly
      setSelectedCase(prev => ({
        ...prev,
        selected_advocate: ""
      }));
      setAssignedAdvocate("");
      setStandbyAdvocate("");
      fetchCases();
      setSuccessMessage(`Assigned advocate removed.`);
    }
  };

  // Remove Standby Advocate only
  const handleRemoveStandbyAdvocate = async () => {
    setStandbyAdvocate("");
    if (!selectedCase) return;
    try {
      const assignedRes = await fetch(`${API_BASE_URL}/lawfirm-management/assigned-cases`);
      if (assignedRes.ok) {
        const assignedCases = await assignedRes.json();
        const match = assignedCases.find(
          ac => String(ac.case_id) === String(selectedCase.id) || String(ac.case_number) === String(selectedCase.case_no)
        );
        if (match) {
          await fetch(`${API_BASE_URL}/lawfirm-management/assigned-cases/${match.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...match,
              secondary_advocate_name: "",
              secondaryAdvocateName: ""
            })
          });
        }
      }
      setSuccessMessage(`Standby advocate removed.`);
    } catch (e) {
      console.error("Failed to remove standby advocate:", e);
    }
  };

  // Core execution function for single document assignment
  const executeSingleDocAssign = async (docIdx, targetAdvocate) => {
    if (docIdx === null || !targetAdvocate || !selectedCase) return;
    setDocAssignLoading(true);
    const doc = selectedCase.documents[docIdx];
    try {
      const res = await fetch(`${API_BASE_URL}/lawfirm-management/assign-case`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: selectedCase.id,
          case_name: selectedCase.case_title,
          case_number: selectedCase.case_no,
          case_title: selectedCase.case_title,
          advocate_name: targetAdvocate,
          priority: "Normal",
          due_date: selectedCase.next_hearing_date || "",
          assignment_notes: `Document '${doc?.file}' assigned by Clerk - Case #${selectedCase.case_no}`,
          status: "Active",
          assigned_documents: doc ? [doc] : [],
          client_name: selectedCase.client_name || ""
        }),
      });

      if (res.ok) {
        setDocAssignedSet(prev => {
          const next = new Set(prev);
          if (doc?.file) next.add(doc.file);
          return next;
        });
        setDocAssignModal(null);
        setDocAssignAdvocate("");

        // Trigger Success Confirmation Center Modal
        setSuccessMessage(`Document "${doc?.file || "file"}" has been successfully assigned to ${targetAdvocate}.`);
      } else {
        alert("Failed to assign document.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to assign document.");
    } finally {
      setDocAssignLoading(false);
    }
  };

  // Handle Document Assign Button Click:
  // If 1 advocate assigned to case -> Direct Assign without modal!
  // If 2 advocates assigned to case -> Open modal to select which one!
  const handleDocumentAssignClick = async (docIdx) => {
    if (caseAssignedAdvocates.length === 0) {
      alert("Please assign a primary advocate to the case first.");
      return;
    }

    // Validate 6-digit PIN before allowing assignment
    const doc = selectedCase?.documents?.[docIdx];
    if (!doc?.password || doc.password.trim().length !== 6) {
      setDocPinError(docIdx);
      return;
    }
    setDocPinError(null);

    if (caseAssignedAdvocates.length === 1) {
      await executeSingleDocAssign(docIdx, caseAssignedAdvocates[0]);
    } else {
      setDocAssignModal(docIdx);
      setDocAssignAdvocate(caseAssignedAdvocates[0] || "");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 w-full bg-slate-50 min-h-screen flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span>Loading Cases...</span>
        </div>
      </div>
    );
  }

  // ── VIEW 1: CASES LIST VIEW (Perfect Height & Alignment for Search, Dropdown & Date Picker) ──
  if (!selectedCase) {
    return (
      <div className="flex-1 w-full bg-slate-50 min-h-screen pb-12 p-3 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">Clerk Case Documents</h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  Select any case to view, upload, digitize OCR formats, or manage documents.
                </p>
              </div>
            </div>
          </div>

          {/* Cases Container */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Header Bar with Pixel-Perfect Height Aligned Controls */}
            <div className="bg-white text-slate-900 border-b border-slate-200 px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600 shrink-0" />
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900">All Active Cases</h3>
                <span className="text-[11px] sm:text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-200 ml-1">
                  {filteredCases.length}
                </span>
              </div>
              {/* Right Controls: Search + Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search Input Box */}
                <div className="relative flex-1 sm:w-64 min-w-[200px] h-9 flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search case, client, court..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                  />
                </div>

                {/* Filter Dropdown */}
                <div className="relative h-9 flex items-center">
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="h-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl pl-3.5 pr-8 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer appearance-none shadow-2xs"
                  >
                    <option value="all">All Cases</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Calendar Date Picker */}
                <div className="h-9 flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs shadow-2xs">
                  <Calendar size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer h-full"
                    title="Filter by exact date"
                  />
                  {customDate && (
                    <button onClick={() => setCustomDate("")} className="text-slate-400 hover:text-slate-600 transition">
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Reset Filters button */}
                {isAnyFilterActive && (
                  <button
                    onClick={handleResetFilters}
                    className="h-9 inline-flex items-center gap-1 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold transition cursor-pointer shadow-2xs"
                    title="Reset all filters"
                  >
                    <RotateCcw size={13} />
                    Reset
                  </button>
                )}
              </div>
            </div>

            {filteredCases.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-slate-500 font-semibold text-xs sm:text-sm space-y-2">
                <Folder className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-2" />
                <p>No matching cases found for the selected filter criteria.</p>
                {isAnyFilterActive && (
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer mt-2"
                  >
                    <RotateCcw size={12} /> Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile / Tablet Cards View (7 items max per page) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-3.5 lg:hidden bg-slate-50/50">
                  {paginatedCases.map((c) => {
                    const docCount = Array.isArray(c.documents) ? c.documents.length : 0;
                    return (
                      <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 flex flex-col justify-between hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-xs font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                            {c.case_id || c.case_no}
                          </span>
                          <StatusBadge status={c.status} />
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{c.case_title}</h4>
                          <div className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                            <p className="flex items-center gap-1.5">
                              <User size={13} className="text-slate-400 shrink-0" />
                              <span className="font-medium">{c.client_name || "—"}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Building2 size={13} className="text-slate-400 shrink-0" />
                              <span className="truncate">{c.court_name || "Munsiff Court"}</span>
                            </p>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                            <FileText size={12} />
                            {docCount} File{docCount !== 1 ? "s" : ""}
                          </span>
                          <button
                            onClick={() => handleSelectCaseToView(c)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white transition active:scale-95 cursor-pointer shadow-2xs"
                          >
                            <Eye size={13} />
                            View Documents
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Full Width Table View (7 items max per page) */}
                <div className="hidden lg:block overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 text-xs font-extrabold uppercase tracking-wider border-b border-slate-200">
                        <th className="py-3.5 px-5 w-32">Client ID / No</th>
                        <th className="py-3.5 px-5">Case Title</th>
                        <th className="py-3.5 px-5 w-40">Client Name</th>
                        <th className="py-3.5 px-5 w-48">Court</th>
                        <th className="py-3.5 px-5 w-28 text-center">Documents</th>
                        <th className="py-3.5 px-5 w-28 text-center">Status</th>
                        <th className="py-3.5 px-5 w-36 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {paginatedCases.map((c) => {
                        const docCount = Array.isArray(c.documents) ? c.documents.length : 0;
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 px-5 font-mono font-bold text-purple-700 text-xs whitespace-nowrap">
                              {c.client_id || c.case_id || c.case_no}
                            </td>
                            <td className="py-4 px-5 font-bold text-slate-900">
                              <span className="line-clamp-2">{c.case_title}</span>
                            </td>
                            <td className="py-4 px-5 font-medium text-slate-700 whitespace-nowrap">
                              {c.client_name || "—"}
                            </td>
                            <td className="py-4 px-5 text-slate-600 text-xs">
                              <div className="flex items-center gap-1.5">
                                <Building2 size={13} className="text-slate-400 shrink-0" />
                                <span className="truncate max-w-[180px]">{c.court_name || "Munsiff Court"}</span>
                              </div>
                            </td>
                            <td className="py-4 px-5 text-center">
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                <FileText size={12} />
                                {docCount}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-center">
                              <StatusBadge status={c.status} />
                            </td>
                            <td className="py-4 px-5 text-center">
                              <button
                                onClick={() => handleSelectCaseToView(c)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white transition shadow-2xs active:scale-95 cursor-pointer whitespace-nowrap"
                              >
                                <Eye size={13} />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Pagination Bar (Shows 7 items max) */}
                {filteredCases.length > 0 && (
                  <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 font-medium">
                    <div>
                      Showing <span className="font-bold text-slate-900">{startIndex + 1}</span> to{" "}
                      <span className="font-bold text-slate-900">{endIndex}</span> of{" "}
                      <span className="font-bold text-slate-900">{filteredCases.length}</span> cases
                    </div>

                    <div className="flex items-center gap-1.5 self-center sm:self-auto">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition cursor-pointer"
                      >
                        <ChevronLeft size={14} /> Previous
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1 px-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                              currentPage === pageNum
                                ? "bg-blue-600 text-white shadow-2xs font-extrabold"
                                : "text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition cursor-pointer"
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW 2: SINGLE CASE DOCUMENTS & OCR DETAILS ──
  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen pb-12 relative">
      {/* Responsive Sticky Header with Back Button */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-3.5 sticky top-0 z-30 shadow-xs mb-4 sm:mb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left Section: Back Button & Case Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => setSelectedCase(null)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition cursor-pointer shrink-0 border border-slate-200 shadow-2xs"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Back to Cases List</span>
              <span className="sm:hidden">Back</span>
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-lg font-black text-slate-900 leading-tight truncate">
                Case Documents: {selectedCase.case_title}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium hidden sm:block truncate">
                Manage documents, PIN passwords, OCR digitization, and advocate assignments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Case Documents Detail Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {caseLoading ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-slate-200 text-center flex items-center justify-center gap-3 text-slate-500 font-bold text-xs sm:text-sm">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span>Loading case documents...</span>
          </div>
        ) : (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Case Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pb-4 border-b border-slate-100">
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Case Title</p>
                <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">{selectedCase.case_title}</p>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Client ID</p>
                <p className="text-xs sm:text-sm font-bold text-purple-700 mt-0.5 font-mono truncate">{selectedCase.client_id || selectedCase.case_id || selectedCase.case_no}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Court</p>
                <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">{selectedCase.court_name || "Munsiff Court"}</p>
              </div>
              <div className="flex items-center justify-between sm:justify-end bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase sm:hidden">Status</span>
                <StatusBadge status={selectedCase.status} />
              </div>
            </div>

            {/* Assign Primary Advocate & Standby Advocate Box */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                  <UserCheck size={15} className="text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 text-xs sm:text-sm">Assign Advocates (Lead & Standby)</h4>
                  <p className="text-[11px] sm:text-xs text-blue-600">Assign a Primary Advocate and an optional Standby (Backup) Advocate for this case</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Primary Advocate Selection / Card */}
                <div className="bg-white border border-blue-200 rounded-xl p-3.5 shadow-2xs space-y-2">
                  <div className="flex items-center gap-1 text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">
                    <UserCheck size={12} />
                    <span>Primary Advocate (Lead)</span>
                  </div>
                  {assignedAdvocate ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {assignedAdvocate.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-xs font-bold text-slate-900 truncate">{assignedAdvocate}</p>
                      </div>
                      <button
                        onClick={handleUnassignAdvocate}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <select
                      value={assignedAdvocate}
                      onChange={(e) => setAssignedAdvocate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">— Select Primary Advocate —</option>
                      {advocates.map((adv) => {
                        const name = adv.advocateName || adv.advocate_name || adv.username || adv.name || `Advocate #${adv.id}`;
                        return (
                          <option key={adv.id} value={name} disabled={name === standbyAdvocate}>
                            {name} {adv.role ? `(${adv.role})` : ""}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                {/* Standby Advocate Selection / Card */}
                <div className="bg-white border border-indigo-200 rounded-xl p-3.5 shadow-2xs space-y-2">
                  <div className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">
                    <ShieldCheck size={12} />
                    <span>Standby Advocate (Backup)</span>
                  </div>
                  {standbyAdvocate ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {standbyAdvocate.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-xs font-bold text-slate-900 truncate">{standbyAdvocate}</p>
                      </div>
                      <button
                        onClick={handleRemoveStandbyAdvocate}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <select
                      value={standbyAdvocate}
                      onChange={(e) => setStandbyAdvocate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">— Select Standby Advocate (Optional) —</option>
                      {advocates.map((adv) => {
                        const name = adv.advocateName || adv.advocate_name || adv.username || adv.name || `Advocate #${adv.id}`;
                        return (
                          <option key={adv.id} value={name} disabled={name === assignedAdvocate}>
                            {name} {adv.role ? `(${adv.role})` : ""}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              </div>

              {/* Save Advocate Assignment Action */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleAssignDocument}
                  disabled={!assignedAdvocate || assignLoading}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
                >
                  <Send size={14} />
                  {assignLoading ? "Saving..." : "Save Advocate Assignment"}
                </button>
              </div>
            </div>

            {/* OCR Extract & Digitize Document Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 overflow-hidden">
              <OCRPanel caseId={selectedCase?.id} onSaveToDocuments={handleSaveOcrToCaseDocuments} />
            </div>

            {/* Case Documents Table Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              {/* Clean White Action Bar with + Add Document button */}
              <div className="bg-white text-slate-900 border-b border-slate-200 px-4 sm:px-5 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-blue-600 shrink-0" />
                  <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900">Case Documents</h3>
                  <span className="text-[11px] sm:text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200 ml-1">
                    {selectedCase.documents?.length || 0}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setNewDocName("");
                    setNewDocFile(null);
                    setNewDocPin("");
                    setAddDocModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition shadow-xs cursor-pointer w-full sm:w-auto"
                >
                  <Plus size={15} />
                  Add Document
                </button>
              </div>

              {selectedCase.documents && selectedCase.documents.length > 0 ? (
                <>
                  {/* Mobile Cards for Documents */}
                  <div className="block md:hidden divide-y divide-slate-100 bg-slate-50/50">
                    {selectedCase.documents.map((doc, idx) => (
                      <div key={idx} className="p-4 bg-white space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingDocument(doc)}
                            className="font-bold text-slate-900 text-xs sm:text-sm hover:text-blue-600 transition-colors text-left line-clamp-2"
                          >
                            📄 {doc.file || "Unnamed File"}
                          </button>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            {doc.documentType && doc.documentType.includes(": ")
                              ? doc.documentType.split(": ")[1]
                              : doc.documentType || "Other"}
                          </span>
                        </div>

                        {/* PIN Input Mobile */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <input
                                type={showPasswordIdx === idx ? "text" : "password"}
                                placeholder="PIN Password"
                                value={doc.password || ""}
                                maxLength={6}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, "");
                                  handleDocPasswordChange(idx, val);
                                  if (val.length === 6) setDocPinError(null);
                                }}
                                className={`w-full rounded-xl border px-3 py-1.5 text-xs font-mono tracking-wider focus:outline-none focus:ring-2 transition ${
                                  docPinError === idx
                                    ? "border-red-500 focus:ring-red-500/20"
                                    : "border-slate-300 focus:ring-blue-500"
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswordIdx(showPasswordIdx === idx ? null : idx)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                              >
                                {showPasswordIdx === idx ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                          </div>
                          {docPinError === idx && (
                            <p className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                              <span>⚠</span> Enter a 6-digit PIN to assign
                            </p>
                          )}
                        </div>

                        {/* Mobile Actions Bar */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setViewingDocument(doc)}
                            className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            <Eye size={13} /> View
                          </button>
                          <button
                            onClick={() => handleDocumentAssignClick(idx)}
                            disabled={caseAssignedAdvocates.length === 0}
                            title={caseAssignedAdvocates.length === 0 ? "Assign a case advocate above first" : "Assign document"}
                            className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white disabled:opacity-40"
                          >
                            <Send size={11} /> Assign
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCaseDocument(idx)}
                            className="p-1.5 rounded-lg text-rose-500 bg-rose-50 border border-rose-200"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop / Tablet Table View */}
                  <div className="hidden md:block overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[650px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 text-xs font-extrabold uppercase tracking-wider border-b border-slate-200">
                          <th className="py-3 px-5">Case Documents</th>
                          <th className="py-3 px-5 w-40">Doc Type</th>
                          <th className="py-3 px-5 w-56">Document Password</th>
                          <th className="py-3 px-5 w-44">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {selectedCase.documents.map((doc, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-5 font-semibold text-slate-700">
                              <button
                                type="button"
                                onClick={() => setViewingDocument(doc)}
                                className="flex items-center gap-2 text-left font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer group"
                                title="Click to view document content"
                              >
                                <FileText size={15} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
                                <span className="underline decoration-slate-200 underline-offset-4 group-hover:decoration-blue-600 truncate max-w-xs">
                                  {doc.file || "Unnamed File"}
                                </span>
                              </button>
                            </td>
                            <td className="py-4 px-5">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                                {doc.documentType && doc.documentType.includes(": ")
                                  ? doc.documentType.split(": ")[1]
                                  : doc.documentType || "Other"}
                              </span>
                            </td>
                            <td className="py-4 px-5">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <div className="relative flex-1 min-w-[160px]">
                                    <input
                                      type={showPasswordIdx === idx ? "text" : "password"}
                                      placeholder="Enter 6-digit PIN"
                                      value={doc.password || ""}
                                      maxLength={6}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "");
                                        handleDocPasswordChange(idx, val);
                                        if (val.length === 6) setDocPinError(null);
                                      }}
                                      className={`w-full rounded-xl border px-3 py-1.5 pr-8 text-xs font-mono tracking-[0.2em] text-slate-900 placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:ring-2 transition ${
                                        docPinError === idx
                                          ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                          : doc.password && doc.password.length > 0 && doc.password.length < 6
                                          ? "border-amber-400 focus:ring-amber-400/20 focus:border-amber-400"
                                          : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-500"
                                      }`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPasswordIdx(showPasswordIdx === idx ? null : idx)}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                      title={showPasswordIdx === idx ? "Hide PIN" : "Show PIN"}
                                    >
                                      {showPasswordIdx === idx ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                  </div>
                                  {doc.password && doc.password.length === 6 ? (
                                    <button
                                      onClick={() => handleDocPasswordChange(idx, "")}
                                      className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-2 py-0.5 rounded-full transition cursor-pointer shrink-0"
                                    >
                                      Reset
                                    </button>
                                  ) : null}
                                </div>
                                {docPinError === idx && (
                                  <p className="text-[11px] font-bold text-red-500 flex items-center gap-1 mt-0.5">
                                    <span>⚠</span> Enter a 6-digit PIN to assign this document
                                  </p>
                                )}
                              </div>
                            </td>
                            {/* Action column */}
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setViewingDocument(doc)}
                                  title="View document content"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 border border-slate-200 transition cursor-pointer"
                                >
                                  <Eye size={13} /> View
                                </button>

                                {docAssignedSet.has(doc.file) && doc.password && doc.password.trim().length === 6 ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle size={12} /> Assigned
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleDocumentAssignClick(idx)}
                                    disabled={caseAssignedAdvocates.length === 0}
                                    title={caseAssignedAdvocates.length === 0 ? "Assign a case advocate above first" : "Assign document"}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-40 cursor-pointer"
                                  >
                                    <Send size={11} /> Assign
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteCaseDocument(idx)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="bg-slate-50 p-6 sm:p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    <FileText size={22} className="text-slate-400" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">
                    No Documents Found
                  </h4>
                  <p className="text-slate-500 text-xs max-w-xs mx-auto mb-4">
                    There are no documents uploaded for this case yet. Click "+ Add Document" above or use OCR scanner.
                  </p>
                  <button
                    onClick={() => {
                    setNewDocName("");
                    setNewDocFile(null);
                    setNewDocPin("");
                    setAddDocModalOpen(true);
                  }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus size={14} /> Add Document
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Success Confirmation Center Modal */}
      {successMessage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4 border border-slate-100 relative animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle size={32} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">Assignment Successful!</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                {successMessage}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setSuccessMessage("")}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-2xs active:scale-95 cursor-pointer"
              >
                OK / Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <DocumentViewerModal
          document={viewingDocument}
          fileUrl={viewingDocument.url || viewingDocument.file}
          title={viewingDocument.file || viewingDocument.title || "Document"}
          badge={viewingDocument.documentType}
          onClose={() => setViewingDocument(null)}
        />
      )}

      {/* Add Document Modal */}
      {addDocModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Add Document to Case</h3>
              </div>
              <button
                type="button"
                onClick={() => setAddDocModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select File */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select File <span className="text-rose-500">*</span>
              </label>
              <input
                type="file"
                required
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setNewDocFile(file);
                    setNewDocName(file.name);
                  }
                }}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-300 rounded-xl p-1 bg-slate-50"
              />
            </div>

            {/* Document Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Document Name
              </label>
              <input
                type="text"
                name="non_credential_doc_title"
                autoComplete="off"
                placeholder="e.g. Counter_Affidavit_signed.pdf"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Document Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Document Type
              </label>
              <select
                value={newDocType}
                onChange={(e) => setNewDocType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Counter Affidavit">Counter Affidavit</option>
                <option value="Vakalatnama">Vakalatnama</option>
                <option value="Plaint / Petition">Plaint / Petition</option>
                <option value="Written Statement">Written Statement</option>
                <option value="FIR Copy">FIR Copy</option>
                <option value="Bail Application">Bail Application</option>
                <option value="Evidence Document">Evidence Document</option>
                <option value="Certified Order Copy">Certified Order Copy</option>
                <option value="Identity Proof">Identity Proof</option>
                <option value="Other Legal Document">Other Legal Document</option>
              </select>
            </div>

            {/* Document PIN */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Document Password (6-Digit PIN) <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                style={{ WebkitTextSecurity: "disc" }}
                placeholder="Enter 6-digit PIN"
                maxLength={6}
                value={newDocPin}
                onChange={(e) => setNewDocPin(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-mono tracking-[0.2em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAddDocModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddDocumentSubmit}
                disabled={addDocLoading || !newDocFile}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                {addDocLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...
                  </>
                ) : (
                  "+ Add Document"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Single Document Modal (Appears ONLY when 2 advocates are assigned to this case) */}
      {docAssignModal !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Assign Document</h3>
              <button
                onClick={() => setDocAssignModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Select which advocate to assign document <span className="font-bold text-slate-800">"{selectedCase?.documents[docAssignModal]?.file}"</span> to:
            </p>
            <select
              value={docAssignAdvocate}
              onChange={(e) => setDocAssignAdvocate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select Advocate —</option>
              {caseAssignedAdvocates.map((advName, i) => (
                <option key={i} value={advName}>
                  {advName}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDocAssignModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => executeSingleDocAssign(docAssignModal, docAssignAdvocate)}
                disabled={!docAssignAdvocate || docAssignLoading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {docAssignLoading ? "Assigning..." : "Confirm Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Case Modal */}
      {addCaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <form
            onSubmit={handleAddCaseSubmit}
            autoComplete="off"
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in fade-in max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Create New Case</h3>
              </div>
              <button
                type="button"
                onClick={() => setAddCaseModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Case Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Case Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Anil Kumar vs State of Kerala"
                value={newCaseTitle}
                onChange={(e) => setNewCaseTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Case Number / ID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Case No / ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. OS 450/2026"
                  value={newCaseNo}
                  onChange={(e) => setNewCaseNo(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Client Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Client Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anil Kumar"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Case Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Case Type
                </label>
                <select
                  value={newCaseType}
                  onChange={(e) => setNewCaseType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Civil">Civil</option>
                  <option value="Criminal">Criminal</option>
                  <option value="Family Court">Family Court</option>
                  <option value="Corporate / Commercial">Corporate / Commercial</option>
                  <option value="Property / Land">Property / Land</option>
                  <option value="High Court Appeal">High Court Appeal</option>
                  <option value="Motor Accident Claims">Motor Accident Claims</option>
                  <option value="Labor & Employment">Labor & Employment</option>
                  <option value="Taxation">Taxation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Court Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Court Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Munsiff Court Ernakulam"
                  value={newCourtName}
                  onChange={(e) => setNewCourtName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Next Hearing Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Next Hearing Date
                </label>
                <input
                  type="date"
                  value={newNextHearingDate}
                  onChange={(e) => setNewNextHearingDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Case Status */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Case Status
                </label>
                <select
                  value={newCaseStatus}
                  onChange={(e) => setNewCaseStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Client Contact Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Client Contact Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={newContactNo}
                  onChange={(e) => setNewContactNo(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Client Email ID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Client Email ID
                </label>
                <input
                  type="email"
                  placeholder="e.g. client@gmail.com"
                  value={newEmailId}
                  onChange={(e) => setNewEmailId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Case Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Case Description / Summary
              </label>
              <textarea
                rows={2}
                placeholder="Brief summary or description of the case..."
                value={newCaseDescription}
                onChange={(e) => setNewCaseDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAddCaseModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addCaseLoading || !newCaseTitle.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                {addCaseLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating Case...
                  </>
                ) : (
                  "+ Create Case"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ClerkDocumentsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 w-full bg-slate-50 min-h-screen flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span>Loading...</span>
        </div>
      </div>
    }>
      <ClerkDocumentsContent />
    </Suspense>
  );
}
