import CaseDetailClient from "./CaseDetailClient";
import { use } from "react";

export default function CaseDetailPage({ params }) {
  const { id } = use(params);
  return <CaseDetailClient id={id} />;
}
