// 2. Update your root layout file: src/app/layout.tsx
// We will wrap the page content with our new ClientProvider.

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProvider } from "@/components/ClientProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Client Planning Portal",
  description: "A portal for wedding photography clients.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
return (<html lang="en" suppressHydrationWarning><body className={inter.className}><ClientProvider>{children}</ClientProvider></body></html>);
}
