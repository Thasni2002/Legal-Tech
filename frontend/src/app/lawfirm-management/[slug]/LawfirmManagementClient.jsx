"use client";

import LawfirmAdd from "@/pages/UI/LawfirmManagement/LawfirmAdd";
import AssignAdv from "@/pages/UI/LawfirmManagement/AssignAdv";
import AssignDocuments from "@/pages/UI/LawfirmManagement/AssignDocuments";
import { useRouter } from "next/navigation";

export default function LawfirmManagementClient({ slug }) {
  const router = useRouter();

  const handleClose = () => {
    router.push("/lawfirm-management");
  };

  if (slug === "add-manage-firm") {
    return <LawfirmAdd onCancel={handleClose} />;
  }

  if (slug === "assign-advocate") {
    return <AssignAdv isOpen={true} onClose={handleClose} />;
  }

  if (slug === "assign-documents") {
    return <AssignDocuments isOpen={true} onClose={handleClose} />;
  }

  return <div>Page Not Found</div>;
}
