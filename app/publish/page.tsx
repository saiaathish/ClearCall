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
          <h1 className="page-title">Build a case reviewers can inspect</h1>
          <p className="page-description">
            Pair a rights-documented clip with a decision, rule path, and structured factors. This
            demo stores the submitted draft in your browser; it does not publish or verify it.
          </p>
        </div>
        <span className="status-badge status-badge--pending">Local demo only</span>
      </header>

      <PublisherForm />
    </div>
  );
}
