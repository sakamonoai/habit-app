import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "ハビチャレ",
  description: "三日坊主を卒業する習慣化アプリ。仲間と一緒にチャレンジして、達成したらデポジット全額返金。",
  manifest: "/manifest.json",
  metadataBase: new URL("https://habit-app-sand.vercel.app"),
  openGraph: {
    title: "ハビチャレ｜サボるとお金を没収されるアプリ",
    description: "三日坊主を卒業する習慣化アプリ。デポジットを預けて仲間とチャレンジ。達成すれば全額返金、サボったら没収。だから続く。",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
    type: "website",
    locale: "ja_JP",
    siteName: "ハビチャレ",
  },
  twitter: {
    card: "summary",
    title: "ハビチャレ｜サボるとお金を没収されるアプリ",
    description: "三日坊主を卒業する習慣化アプリ。デポジットを預けて仲間とチャレンジ。達成すれば全額返金。",
    images: ["/icons/icon-512.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ハビチャレ",
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
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
      lang="ja"
      className="h-full antialiased"
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
