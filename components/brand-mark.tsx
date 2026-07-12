import Image from "next/image";
import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="Open ClearCall feed">
      <Image
        className="brand-logo brand-logo--full"
        src="/brand/clearcall-logo.jpg"
        alt=""
        width={220}
        height={64}
        priority
      />
      <Image
        className="brand-logo brand-logo--mark"
        src="/brand/clearcall-mark.jpg"
        alt=""
        width={40}
        height={40}
        priority
      />
      {!compact && (
        <span className="brand-copy">
          <span>Referee decisions, explained.</span>
        </span>
      )}
    </Link>
  );
}
