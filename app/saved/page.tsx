import type { Metadata } from "next";
import { SavedView } from "@/components/saved-view";

export const metadata: Metadata = {
  title: "Saved cases",
  description: "Search, filter, and continue ClearCall cases saved on this device.",
};

export default function SavedPage() {
  return <SavedView />;
}
