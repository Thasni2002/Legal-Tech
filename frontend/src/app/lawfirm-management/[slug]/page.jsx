import { Suspense } from "react";
import LawfirmManagementClient from "./LawfirmManagementClient";

export function generateStaticParams() {
  return [
    { slug: "add-manage-firm" },
    { slug: "assign-advocate" },
    { slug: "view" },
  ];
}

export default async function Page({ params }) {
  const { slug } = await params;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LawfirmManagementClient slug={slug} />
    </Suspense>
  );
}