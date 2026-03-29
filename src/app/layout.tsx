import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/features/language";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { fontVariables } from "./fonts";

export const metadata: Metadata = {
  title: "Mafia Game",
  description: "A mobile-friendly Mafia game role distributor",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mafia",
  },
  icons: {
    apple: "/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${fontVariables} dark`}
      suppressHydrationWarning
    >
      <body className="antialiased bg-black text-white">
        <LanguageProvider>
          <ServiceWorkerRegistration />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
