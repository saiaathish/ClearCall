import type { Metadata } from "next";
import { PublisherForm } from "@/components/publisher-form";

export const metadata: Metadata = {
  title: "Publish a case",
  description:
    "Create a structured ClearCall case draft for local demonstration and expert review.",
};

export default function PublishPage() {
  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-header__copy">
          <p className="eyebrow">Verified creator flow · frontend prototype</p>
          <h1 className="page-title">Publish a case</h1>
          <p className="page-description">
            Pair a clear incident description or rights-documented media with a decision, rule path,
            and structured factors. This demo stores the draft in your browser; it does not publish or verify it.
            Add the incident, the decision question, and answer choices. Stored in this browser only.
          </p>
        </div>
        <span className="status-badge status-badge--pending">Local demo only</span>
      </header>

      <PublisherForm />
    </div>
  );
}
