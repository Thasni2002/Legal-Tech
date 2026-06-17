import React from "react";
import ClientSlugClient from "./ClientSlugClient";

export function generateStaticParams() {
  return [
   
    { slug: "case-tracking" },
   
    { slug: "view-history" },
    
  
  ];
}

export default async function Page({ params }) {
  const { slug } = await params;
  return <ClientSlugClient slug={slug} />;
}
