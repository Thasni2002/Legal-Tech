
import "./globals.css";
import LayoutWrapper from "@/components/layout/LayoutWrapper";

export const metadata = {
  title: "Legal Tech — Enterprise Legal Management",
  description: "Premium Legal Tech SaaS platform for law firms, advocates, and case management.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}