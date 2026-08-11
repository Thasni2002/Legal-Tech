import CaseDetailClient from "./CaseDetailClient";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export default async function CaseDetailPage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  return <CaseDetailClient id={id} />;
}

