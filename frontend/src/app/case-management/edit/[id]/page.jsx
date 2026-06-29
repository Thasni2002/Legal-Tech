import EditCaseClient from "./EditCaseClient";



export default function EditCasePage({ params }) {
  return <EditCaseClient id={params.id} />;
}