import { Suspense } from "react";
import LawfirmManagementClient from "./LawfirmManagementClient";

export async function generateStaticParams() {
  return [
    { slug: "assign-advocate" },
    { slug: "add-manage-firm" },
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