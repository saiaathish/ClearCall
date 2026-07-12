"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Bookmark, Check, Flag, Share2, ShieldAlert } from "lucide-react";
import type { ReportReason } from "@/lib/types";
import { useDemo } from "@/context/demo-context";
import { useToast } from "@/components/toast-provider";

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "copyright", label: "Copyright or rights concern" },
  { value: "inaccurate", label: "Inaccurate or misleading content" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "spam", label: "Spam or abuse" },
  { value: "other", label: "Other" },
];

export function SaveButton({ caseId, showLabel = false }: { caseId: string; showLabel?: boolean }) {
  const { savedCaseIds, toggleSaved } = useDemo();
  const { showToast } = useToast();
  const saved = savedCaseIds.includes(caseId);

  const handleSave = () => {
    const wasSaved = saved;
    const didSave = toggleSaved(caseId);
    if (didSave === wasSaved) {
      // Auth gate blocked the toggle (guest redirected to /auth).
      return;
    }
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

export function ReportButton({ caseId, showLabel = false }: { caseId: string; showLabel?: boolean }) {
  const { reports, removedCaseIds, reportCase } = useDemo();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("copyright");
  const [details, setDetails] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const alreadyReported = reports.some(
    (report) => report.caseId === caseId && report.status === "open",
  );
  const removed = removedCaseIds.includes(caseId);
  const disabled = alreadyReported || removed;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => {
    setOpen(false);
    setDetails("");
    setReason("copyright");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const created = reportCase({ caseId, reason, details });
    if (!created) {
      showToast(
        removed
          ? "This case is already removed from the local feed."
          : "You already have an open report for this case.",
      );
      close();
      return;
    }
    showToast(
      reason === "copyright"
        ? "Copyright report saved locally. Review it on your profile moderation queue."
        : "Report saved locally. Review it on your profile moderation queue.",
      "success",
    );
    close();
  };

  return (
    <>
      {showLabel ? (
        <button
          className="button button--ghost"
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          aria-haspopup="dialog"
        >
          <Flag aria-hidden="true" size={16} />
          {removed ? "Removed" : alreadyReported ? "Reported" : "Report"}
        </button>
      ) : (
        <button
          className="icon-button"
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          aria-label={removed ? "Case already removed" : alreadyReported ? "Case already reported" : "Report case"}
          aria-haspopup="dialog"
        >
          <Flag aria-hidden="true" size={18} />
        </button>
      )}

      <dialog
        className="report-dialog"
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={close}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <form className="report-dialog__form" onSubmit={submit}>
          <header className="report-dialog__header">
            <h2 id={titleId}>Report this case</h2>
            <p id={descriptionId}>
              Reports stay in this browser only. This prototype does not notify a live moderation team.
            </p>
          </header>

          <div className="permission-notice" role="note">
            <ShieldAlert aria-hidden="true" size={16} />
            <div>
              <strong>Copyright warning.</strong> ClearCall is for team-recorded, openly licensed, or
              otherwise authorized footage only. Do not upload, rehost, or keep professional broadcast
              clips without rights clearance. Flag suspected unauthorized media here so it can be
              removed from the local demo feed.
            </div>
          </div>

          <label className="field" htmlFor={`report-reason-${caseId}`}>
            <span>Reason</span>
            <select
              id={`report-reason-${caseId}`}
              value={reason}
              onChange={(event) => setReason(event.target.value as ReportReason)}
              required
            >
              {REPORT_REASONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field" htmlFor={`report-details-${caseId}`}>
            <span>Details (optional)</span>
            <textarea
              id={`report-details-${caseId}`}
              value={details}
              onChange={(event) => setDetails(event.target.value.slice(0, 500))}
              rows={3}
              placeholder="Describe the rights concern or other issue."
            />
          </label>

          <div className="button-row">
            <button className="button button--ghost" type="button" onClick={close}>
              Cancel
            </button>
            <button className="button button--danger" type="submit">
              Submit report
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
