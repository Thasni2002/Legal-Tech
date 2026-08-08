import EditCaseClient from "./EditCaseClient";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export default async function EditCasePage({ params }) {
  const { id } = await params;
  return <EditCaseClient id={id} />;
}

