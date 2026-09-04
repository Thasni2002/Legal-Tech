import { apiClient, apiUpload } from "./api";

// ==========================================
// 1. AUTHENTICATION & SECURITY APIs
// ==========================================
export const loginUser = (credentials) =>
  apiClient("/auth/login", { method: "POST", body: credentials });

export const registerUser = (userData) =>
  apiClient("/auth/register", { method: "POST", body: userData });

export const getAuthMe = () =>
  apiClient("/auth/me");

export const sendForgotPasswordOTP = (payload) =>
  apiClient("/auth/forgot-password/send-otp", { method: "POST", body: payload });

export const verifyForgotPasswordOTP = (payload) =>
  apiClient("/auth/forgot-password/verify-otp", { method: "POST", body: payload });

export const resetPassword = (payload) =>
  apiClient("/auth/forgot-password/reset", { method: "POST", body: payload });

export const loginWithOTP = (payload) =>
  apiClient("/auth/forgot-password/login-with-otp", { method: "POST", body: payload });


// ==========================================
// 2. PERMISSIONS & ROLE MANAGEMENT APIs
// ==========================================
export const getPermissions = () =>
  apiClient("/permissions");

export const getRoles = () =>
  apiClient("/permissions/roles");

export const createRole = (roleData) =>
  apiClient("/permissions/roles", { method: "POST", body: roleData });

export const updateRole = (id, roleData) =>
  apiClient(`/permissions/roles/${id}`, { method: "PUT", body: roleData });

export const deleteRole = (id) =>
  apiClient(`/permissions/roles/${id}`, { method: "DELETE" });

export const getUsers = () =>
  apiClient("/permissions/users");

export const createUser = (userData) =>
  apiClient("/permissions/users", { method: "POST", body: userData });

export const updateUser = (id, userData) =>
  apiClient(`/permissions/users/${id}`, { method: "PUT", body: userData });

export const deleteUser = (id) =>
  apiClient(`/permissions/users/${id}`, { method: "DELETE" });

export const provisionUser = (userData) =>
  apiClient("/permissions/users/provision", { method: "POST", body: userData });

export const checkUserDeleteImpact = (id) =>
  apiClient(`/permissions/users/${id}/delete-impact`);

export const updateDefaultRolePermissions = (roleName, matrix) =>
  apiClient(`/permissions/role/${encodeURIComponent(roleName)}`, { method: "PUT", body: matrix });


// ==========================================
// 3. CASE MANAGEMENT & VAULT APIs
// ==========================================
export const getCases = () =>
  apiClient("/case-management/");

export const getCaseById = (id) =>
  apiClient(`/case-management/${id}`);

export const createCase = (caseData) =>
  apiClient("/case-management/", { method: "POST", body: caseData });

export const updateCase = (id, caseData) =>
  apiClient(`/case-management/${id}`, { method: "PUT", body: caseData });

export const deleteCase = (id) =>
  apiClient(`/case-management/${id}`, { method: "DELETE" });

export const uploadCaseDocument = (caseId, formData) =>
  apiUpload(`/case-management/${caseId}/upload-document`, formData);

export const getCaseDocuments = (caseId) =>
  apiClient(`/case-management/${caseId}/documents`);

export const deleteCaseDocument = (docId) =>
  apiClient(`/case-management/documents/${docId}`, { method: "DELETE" });

export const addCaseNote = (caseId, noteData) =>
  apiClient(`/case-management/${caseId}/notes`, { method: "POST", body: noteData });

export const getCaseNotes = (caseId) =>
  apiClient(`/case-management/${caseId}/notes`);

export const deleteCaseNote = (noteId) =>
  apiClient(`/case-management/notes/${noteId}`, { method: "DELETE" });

export const updateWorkflowStatus = (caseId, statusData) =>
  apiClient(`/case-management/${caseId}/workflow`, { method: "POST", body: statusData });

export const getWorkflowHistory = (caseId) =>
  apiClient(`/case-management/${caseId}/workflow`);

// Confidential Vault APIs
export const unlockVault = (caseId, password) =>
  apiClient("/confidential-vault/unlock", { method: "POST", body: { case_id: caseId, case_password: password } });

export const sendVaultOTP = (caseId) =>
  apiClient("/confidential-vault/send-otp", { method: "POST", body: { case_id: caseId } });

export const verifyVaultOTP = (caseId, otp) =>
  apiClient("/confidential-vault/verify-otp", { method: "POST", body: { case_id: caseId, otp } });

export const resetVaultPassword = (caseId, payload) =>
  apiClient("/confidential-vault/reset-password", { method: "POST", body: { case_id: caseId, ...payload } });

export const getVaultAuditTrail = (caseId) =>
  apiClient(`/confidential-vault/${caseId}/audit-trail`);


// ==========================================
// 4. LAW FIRM MANAGEMENT & ADVOCATES APIs
// ==========================================
export const getAdvocates = () =>
  apiClient("/lawfirm-management/");

export const addAdvocate = (data) =>
  apiClient("/lawfirm-management/", { method: "POST", body: data });

export const updateAdvocate = (id, data) =>
  apiClient(`/lawfirm-management/${id}`, { method: "PUT", body: data });

export const deleteAdvocate = (id) =>
  apiClient(`/lawfirm-management/${id}`, { method: "DELETE" });

export const assignCaseToAdvocate = (assignmentData) =>
  apiClient("/lawfirm-management/assign-case", { method: "POST", body: assignmentData });

export const getAssignedCases = () =>
  apiClient("/lawfirm-management/assigned-cases");

export const getAssignedCaseById = (caseId) =>
  apiClient(`/lawfirm-management/assigned-cases/${caseId}`);

export const updateCaseAssignment = (caseId, data) =>
  apiClient(`/lawfirm-management/assigned-cases/${caseId}`, { method: "PUT", body: data });

export const deleteCaseAssignment = (caseId) =>
  apiClient(`/lawfirm-management/assigned-cases/${caseId}`, { method: "DELETE" });


// ==========================================
// 5. CLIENT MANAGEMENT APIs
// ==========================================
export const getClients = () =>
  apiClient("/client-management/");

export const addClient = (clientData) =>
  apiClient("/client-management/", { method: "POST", body: clientData });

export const getClientById = (id) =>
  apiClient(`/client-management/${id}`);

export const updateClient = (id, clientData) =>
  apiClient(`/client-management/${id}`, { method: "PUT", body: clientData });

export const deleteClient = (id) =>
  apiClient(`/client-management/${id}`, { method: "DELETE" });

export const getNextClientId = () =>
  apiClient("/clients/next-id");


// ==========================================
// 6. CONSULTATIONS APIs
// ==========================================
export const getConsultations = () =>
  apiClient("/consultations/");

export const createConsultation = (data) =>
  apiClient("/consultations/", { method: "POST", body: data });

export const updateConsultation = (id, data) =>
  apiClient(`/consultations/${id}`, { method: "PUT", body: data });

export const deleteConsultation = (id) =>
  apiClient(`/consultations/${id}`, { method: "DELETE" });

export const addConsultationNote = (id, noteData) =>
  apiClient(`/consultations/${id}/notes`, { method: "POST", body: noteData });

export const getConsultationNotes = (id) =>
  apiClient(`/consultations/${id}/notes`);


// ==========================================
// 7. FINANCE & PAYMENTS APIs
// ==========================================
export const getInvoices = () =>
  apiClient("/finance/invoices");

export const createInvoice = (invoiceData) =>
  apiClient("/finance/invoices", { method: "POST", body: invoiceData });

export const updateInvoice = (id, invoiceData) =>
  apiClient(`/finance/invoices/${id}`, { method: "PUT", body: invoiceData });

export const updateInvoiceStatus = (id, status) =>
  apiClient(`/finance/invoices/${id}/status`, { method: "PUT", body: { status } });

export const deleteInvoice = (id) =>
  apiClient(`/finance/invoices/${id}`, { method: "DELETE" });

export const getFinanceStats = () =>
  apiClient("/finance/stats");

export const getFinanceClients = () =>
  apiClient("/finance/clients");

export const uploadInvoicePDF = (invoiceId, formData) =>
  apiUpload(`/finance/upload-invoice/${invoiceId}`, formData);

export const sendPaymentEmail = (payload) =>
  apiClient("/finance/send-payment-email", { method: "POST", body: payload });

export const getClientInvoices = () =>
  apiClient("/clients/payments/invoices");

export const payClientInvoice = (invoiceId, paymentData) =>
  apiClient(`/clients/payments/invoices/${invoiceId}/pay`, { method: "PUT", body: paymentData });


// ==========================================
// 8. TASKS & CLERK TASKS APIs
// ==========================================
export const getTasks = () =>
  apiClient("/tasks/");

export const createTask = (taskData) =>
  apiClient("/tasks/", { method: "POST", body: taskData });

export const updateTask = (id, taskData) =>
  apiClient(`/tasks/${id}`, { method: "PUT", body: taskData });

export const deleteTask = (id) =>
  apiClient(`/tasks/${id}`, { method: "DELETE" });

export const addTaskMessage = (taskId, messageData) =>
  apiClient(`/tasks/${taskId}/messages`, { method: "POST", body: messageData });

export const getTaskMessages = (taskId) =>
  apiClient(`/tasks/${taskId}/messages`);

export const getClerkTasks = () =>
  apiClient("/clerk/dashboard/tasks");

export const createClerkTask = (taskData) =>
  apiClient("/clerk/dashboard/tasks", { method: "POST", body: taskData });

export const updateClerkTask = (taskId, taskData) =>
  apiClient(`/clerk/dashboard/tasks/${taskId}`, { method: "PUT", body: taskData });

export const deleteClerkTask = (taskId) =>
  apiClient(`/clerk/dashboard/tasks/${taskId}`, { method: "DELETE" });


// ==========================================
// 9. LEAVE MANAGEMENT APIs
// ==========================================
export const getLeaves = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiClient(`/leaves${query ? `?${query}` : ""}`);
};

export const applyLeave = (leaveData) =>
  apiClient("/leaves/apply", { method: "POST", body: leaveData });

export const getLeaveBalances = () =>
  apiClient("/leaves/balances");

export const updateLeaveStatus = (leaveId, statusData) =>
  apiClient(`/leaves/${leaveId}/status`, { method: "PUT", body: statusData });

export const cancelLeave = (leaveId) =>
  apiClient(`/leaves/${leaveId}`, { method: "DELETE" });


// ==========================================
// 10. ECOURTS INTEGRATION APIs
// ==========================================
export const getECourtsMetrics = () =>
  apiClient("/api/ecourts/metrics");

export const lookupCNR = (cnrNumber) =>
  apiClient("/api/ecourts/lookup", { method: "POST", body: { cnrNumber } });

export const searchECourtsCases = (searchParams) =>
  apiClient("/api/ecourts/search", { method: "POST", body: searchParams });

export const getCauseList = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiClient(`/api/ecourts/cause-list${query ? `?${query}` : ""}`);
};

export const syncECourtsCase = (caseId) =>
  apiClient(`/api/ecourts/sync/${caseId}`, { method: "POST" });

export const syncAllECourtsCases = () =>
  apiClient("/api/ecourts/sync-all", { method: "POST" });


// ==========================================
// 11. OCR SCANNER APIs
// ==========================================
export const detectOCRCorners = (formData) =>
  apiUpload("/ocr/detect-corners", formData);

export const scanOCRDocument = (formData) =>
  apiUpload("/ocr/scan", formData);

export const extractOCRText = (payload) =>
  apiClient("/ocr/extract", { method: "POST", body: payload });

export const getOcrResults = () =>
  apiClient("/ocr/results");


// ==========================================
// 12. CLERK OPERATIONS APIs
// ==========================================
export const getCourtVisits = () =>
  apiClient("/clerk/court-visit");

export const createCourtVisit = (visitData) =>
  apiClient("/clerk/court-visit", { method: "POST", body: visitData });

export const updateCourtVisit = (visitId, visitData) =>
  apiClient(`/clerk/court-visit/${visitId}`, { method: "PUT", body: visitData });

export const getPhysicalFiles = () =>
  apiClient("/clerk/format-physical-file/");

export const createPhysicalFile = (fileData) =>
  apiClient("/clerk/format-physical-file/", { method: "POST", body: fileData });

export const updatePhysicalFile = (fileId, fileData) =>
  apiClient(`/clerk/format-physical-file/${fileId}`, { method: "PUT", body: fileData });

export const getEFilingRecords = () =>
  apiClient("/clerk/efiling");

export const createEFilingRecord = (efilingData) =>
  apiClient("/clerk/efiling", { method: "POST", body: efilingData });


// ==========================================
// 13. MESSAGING & CONVERSATION APIs
// ==========================================
export const getConversations = () =>
  apiClient("/messaging/conversations");

export const createConversation = (conversationData) =>
  apiClient("/messaging/conversations", { method: "POST", body: conversationData });

export const getMessages = (conversationId) =>
  apiClient(`/messaging/conversations/${conversationId}/messages`);

export const sendMessage = (conversationId, messageData) =>
  apiClient(`/messaging/conversations/${conversationId}/messages`, { method: "POST", body: messageData });

export const uploadChatAttachment = (formData) =>
  apiUpload("/messaging/upload", formData);

export const getUnreadMessageCount = () =>
  apiClient("/messaging/unread-count");


// ==========================================
// 14. DASHBOARD & ANALYTICS APIs
// ==========================================
export const getDashboardStats = () =>
  apiClient("/dashboard/stats");

export const getRecentActivity = () =>
  apiClient("/dashboard/recent-activity");
