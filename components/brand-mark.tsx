import Image from "next/image";
import Link from "next/link";

export function BrandMark() {
  return (
    <Link className="brand" href="/" aria-label="Open ClearCall feed">
      <Image
        className="brand-logo brand-logo--full"
        src="/brand/clearcall-logo.png"
        alt="ClearCall"
        width={220}
        height={62}
        priority
      />
      <Image
        className="brand-logo brand-logo--mark"
        src="/brand/clearcall-mark.png"
        alt=""
        width={40}
        height={40}
        priority
      />
    </Link>
  );
}
