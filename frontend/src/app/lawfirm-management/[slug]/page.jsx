import LawfirmManagementClient from "./LawfirmManagementClient";

export function generateStaticParams() {
  return [
    { slug: "add-manage-firm" },
    { slug: "assign-advocate" },
    { slug: "assign-documents" },
  ];
}

export default async function Page({ params }) {
  const { slug } = await params;
  return <LawfirmManagementClient slug={slug} />;
}


