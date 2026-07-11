import type { ScenarioStatus } from "@/lib/types";

const statusCopy: Record<
  ScenarioStatus,
  { label: string; className: string; description: string }
> = {
  VERIFIED_RULING: {
    label: "Verified ruling",
    className: "status-badge--verified",
    description: "The rule produces a substantially clear answer after qualified review.",
  },
  EXPERT_CONSENSUS: {
    label: "Expert consensus",
    className: "status-badge--consensus",
    description: "Judgment is involved, but qualified reviewers support a preferred interpretation.",
  },
  OPEN_DISCUSSION: {
    label: "Open discussion",
    className: "status-badge--open",
    description: "Qualified officials may reasonably disagree; no definitive ruling is claimed.",
  },
};

export function StatusBadge({ status }: { status: ScenarioStatus }) {
  const copy = statusCopy[status];
  return (
    <span className={`status-badge ${copy.className}`} title={copy.description}>
      {copy.label}
    </span>
  );
}

export function getStatusLabel(status: ScenarioStatus) {
  return statusCopy[status].label;
}
