import React from "react";
import ClientSlugClient from "./ClientSlugClient";

export function generateStaticParams() {
  return [
    { slug: "client-add" },
    { slug: "case-tracking" },
    { slug: "edit-client" },
    { slug: "client-history" },
  
  ];
}

export default async function Page({ params }) {
  const { slug } = await params;
  return <ClientSlugClient slug={slug} />;
}
