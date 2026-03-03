import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/components/NextAuthProvider";
import { SignInPopup } from "@/components/SignInPopup";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JR Arcade | Tenant Management",
  description: "Secure cross-platform Tenant Management System for JR Arcade",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JR TMS",
  },
  themeColor: "#1e293b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased min-h-screen bg-slate-50 dark:bg-slate-950`} suppressHydrationWarning>
        <NextAuthProvider>
          {children}
          <SignInPopup />
        </NextAuthProvider>
      </body>
    </html>
  );
}
