import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobFit — Tailor your CV to any job",
  description:
    "Tailor your CV and cover letter to any job description, fully in your browser. Bring your own AI key. Open source.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
