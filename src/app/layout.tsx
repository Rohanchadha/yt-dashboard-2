import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YouTube Analytics Dashboard",
  description: "YouTube channel analytics dashboard",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
