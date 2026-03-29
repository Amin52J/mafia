import { Geist, Geist_Mono, Vazirmatn } from "next/font/google";

export const geistSans = Geist({
  variable: "--geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--geist-mono",
  subsets: ["latin"],
});

export const vazir = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
});

export const fontVariables = `${geistSans.variable} ${geistMono.variable} ${vazir.variable}`;
