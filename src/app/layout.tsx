// 2. Update your root layout file: src/app/layout.tsx
// We will wrap the page content with our new ClientProvider.

import { ClientProvider } from "@/components/ClientProvider";
import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import React from "react";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap", variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Client Planning Portal",
  description: "A portal for wedding photography clients.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
return (
  <html lang="en" suppressHydrationWarning>
    <body className={`${plusJakarta.variable} ${playfair.variable}`}>
      <ClientProvider>{children}</ClientProvider>
    </body>
  </html>
);
}
