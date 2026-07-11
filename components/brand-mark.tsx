import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="Open ClearCall feed">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
      </span>
      {!compact && (
        <span className="brand-copy">
          <strong>ClearCall</strong>
          <span>Referee decisions, explained.</span>
        </span>
      )}
    </Link>
  );
}
