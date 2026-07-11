"use client";

import { Bookmark, Check, Share2 } from "lucide-react";
import { useDemo } from "@/context/demo-context";
import { useToast } from "@/components/toast-provider";

export function SaveButton({ caseId, showLabel = false }: { caseId: string; showLabel?: boolean }) {
  const { savedCaseIds, toggleSaved } = useDemo();
  const { showToast } = useToast();
  const saved = savedCaseIds.includes(caseId);

  const handleSave = () => {
    const didSave = toggleSaved(caseId);
    showToast(didSave ? "Case saved for later review." : "Case removed from saved.", "success");
  };

  if (showLabel) {
    return (
      <button
        className={saved ? "button button--secondary" : "button button--ghost"}
        type="button"
        onClick={handleSave}
        aria-pressed={saved}
      >
        {saved ? <Check aria-hidden="true" size={16} /> : <Bookmark aria-hidden="true" size={16} />}
        {saved ? "Saved" : "Save case"}
      </button>
    );
  }

  return (
    <button
      className="icon-button"
      data-active={saved || undefined}
      type="button"
      onClick={handleSave}
      aria-label={saved ? "Remove case from saved" : "Save case"}
      aria-pressed={saved}
    >
      <Bookmark aria-hidden="true" size={18} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}

export function ShareButton({ caseId, showLabel = false }: { caseId: string; showLabel?: boolean }) {
  const { showToast } = useToast();

  const share = async () => {
    const url = `${window.location.origin}/case/${caseId}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Challenge link copied to your clipboard.", "success");
    } catch {
      showToast("Clipboard access was unavailable. Copy the case URL from the address bar.");
    }
  };

  if (showLabel) {
    return (
      <button className="button button--ghost" type="button" onClick={share}>
        <Share2 aria-hidden="true" size={16} /> Share
      </button>
    );
  }

  return (
    <button className="icon-button" type="button" onClick={share} aria-label="Copy case challenge link">
      <Share2 aria-hidden="true" size={18} />
    </button>
  );
}
