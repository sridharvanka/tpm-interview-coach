import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TPM Interview Coach",
  description: "Private interview practice with real-time speech feedback",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
