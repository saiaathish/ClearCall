import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import { ToastProvider } from "@/components/toast-provider";
import { DemoProvider } from "@/context/demo-context";
import "./globals.css";
import "./refined-theme.css";

export const metadata: Metadata = {
  title: { default: "ClearCall | Referee decisions, explained.", template: "%s | ClearCall" },
  description:
    "Review the incident. Commit to a call. See what changed the decision.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#153f32",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
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
