import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JongTee (จองที่) | ระบบจองที่นั่งห้องเรียน โรงเรียน",
  description: "JongTee (จองที่) ระบบจัดการและจองที่นั่ง จองที่นั่งห้องเรียน จองที่นั่งโรงเรียน ใช้งานง่าย จัดการแผนผังห้องเรียนได้สะดวกและรวดเร็ว",
  keywords: [
    "จองที่", 
    "จองที่นั่ง", 
    "จองที่นั่งห้องเรียน", 
    "จองที่นั่งโรงเรียน", 
    "ระบบจองที่นั่ง",
    "JongTee"
  ],
  authors: [{ name: "Bungkii" }],
  openGraph: {
    title: "JongTee (จองที่) | ระบบจองที่นั่ง",
    description: "ระบบจองที่นั่ง จองที่นั่งห้องเรียน จองที่นั่งโรงเรียน สร้างแผนผังและจัดการง่ายๆ ด้วย JongTee",
    url: "https://jongtee.bungkii.vercel.app/",
    siteName: "JongTee",
    locale: "th_TH",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
