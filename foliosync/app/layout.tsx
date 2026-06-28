import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FolioSync — Your Unified Investment Dashboard",
  description: "Upload once. See everything. Act before losses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
