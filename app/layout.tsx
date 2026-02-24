import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Book Tracker API",
  description: "Landing page and API backend for the Book Tracker Android app.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
