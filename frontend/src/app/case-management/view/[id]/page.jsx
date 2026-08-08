import CaseDetailClient from "./CaseDetailClient";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export default async function CaseDetailPage({ params }) {
  const { id } = await params;
  return <CaseDetailClient id={id} />;
}

