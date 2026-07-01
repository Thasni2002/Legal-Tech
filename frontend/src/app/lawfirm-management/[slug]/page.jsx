import { Suspense } from "react";
import LawfirmManagementClient from "./LawfirmManagementClient";

export default async function Page({ params }) {
  const { slug } = await params;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LawfirmManagementClient slug={slug} />
    </Suspense>
  );
}