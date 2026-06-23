"use client";

import AddCaseForm from "@/pages/UI/CaseManagement/AddCaseForm";

export default function EditCaseClient({ id }) {
  return <AddCaseForm editId={id} />;
}