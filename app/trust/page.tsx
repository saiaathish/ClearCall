import type { Metadata } from "next";
import AboutPage from "@/app/about/page";

export const metadata: Metadata = {
  title: "How ClearCall handles trust",
  description: "The method, demo-content disclosure, and prototype limits behind ClearCall.",
};

export default function TrustPage() {
  return <AboutPage />;
}
