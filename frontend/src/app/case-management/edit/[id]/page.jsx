import EditCaseClient from "./EditCaseClient";

export async function generateStaticParams() {
  return [];
}

export default function EditCasePage({ params }) {
  return <EditCaseClient id={params.id} />;
}