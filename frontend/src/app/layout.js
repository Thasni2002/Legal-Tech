import "./globals.css";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen bg-[#f8fafc]">
          <Sidebar />

          <div className="flex-1 flex flex-col md:pl-64 min-h-screen">
            <Navbar />

            <main className="flex-1 p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}