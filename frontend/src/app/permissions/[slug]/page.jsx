import PermissionsSlugClient from "./PermissionsSlugClient";

export function generateStaticParams() {
  return [
    { slug: "roles" },
    { slug: "users" },
  ];
}

export default async function Page({ params }) {
  const { slug } = await params;
  return <PermissionsSlugClient slug={slug} />;
}
