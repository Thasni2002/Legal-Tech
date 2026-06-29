import EditCaseClient from "./EditCaseClient";
import { use } from "react";

export default function EditCasePage({ params }) {
  const { id } = use(params);
  return <EditCaseClient id={id} />;
}