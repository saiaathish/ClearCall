import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="ClearCall feed">
      <span className="brand__mark" aria-hidden="true">
        <span />
        <span />
      </span>
      {!compact && (
        <span className="brand__copy">
          <strong>ClearCall</strong>
          <small>Make the Call</small>
        </span>
      )}
    </Link>
  );
}
