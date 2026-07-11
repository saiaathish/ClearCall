import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { ToastProvider } from "@/components/toast-provider";
import { DemoProvider } from "@/context/demo-context";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: { default: "ClearCall — Make the Call", template: "%s · ClearCall" },
  description:
    "A demonstration decision-training platform for sports officials: watch, decide, explain, compare, and improve.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#070909",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body>
        <DemoProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </DemoProvider>
      </body>
    </html>
  );
}
