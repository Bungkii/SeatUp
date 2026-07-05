import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import LenisProvider from "@/components/LenisProvider";
import StyledComponentsRegistry from "@/lib/registry";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
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
      className={`${prompt.variable} h-full antialiased`}
    >
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      </head>
      <body className="min-h-full flex flex-col">
        <StyledComponentsRegistry>
          <LenisProvider>
            {children}
          </LenisProvider>
        </StyledComponentsRegistry>
        <Analytics />
      </body>
    </html>
  );
}
