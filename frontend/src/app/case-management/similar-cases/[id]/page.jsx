import SimilarCasesClient from "./SimilarCasesClient";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export default async function SimilarCasesPage({ params }) {
  const { id } = await params;
  return <SimilarCasesClient caseId={id} />;
}

