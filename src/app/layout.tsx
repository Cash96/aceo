import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BackButton } from "./components/BackButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ACEO Admin Dashboard",
  description: "Manage AI training, assistants, and open-web learning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`
          ${geistSans.variable} ${geistMono.variable} 
          antialiased 
          min-h-screen
          bg-[#E1FFFF] text-black
        `}
      >
        <div className="w-full bg-[#E1FFFF] px-8 py-4 border-b border-[#00003D]/20">
          <BackButton label="Go Back" />
        </div>
        {children}
      </body>
    </html>
  );
}
