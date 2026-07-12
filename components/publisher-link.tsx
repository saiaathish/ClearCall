import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/avatar";
import { personProfileHref } from "@/data/profiles";
import type { Publisher } from "@/lib/types";

export function PublisherLink({
  publisher,
  size = "md",
  className = "",
  children,
}: {
  publisher: Publisher;
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Link
      className={["publisher-link", className].filter(Boolean).join(" ")}
      href={personProfileHref(publisher)}
      aria-label={`Open ${publisher.displayName}'s profile`}
    >
      <Avatar initials={publisher.avatarInitials} size={size} src={publisher.avatarSrc} />
      {children}
    </Link>
  );
}

export function PublisherNameLink({
  publisher,
  className = "",
  children,
}: {
  publisher: Publisher;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Link
      className={["publisher-name-link", className].filter(Boolean).join(" ")}
      href={personProfileHref(publisher)}
    >
      {children ?? publisher.displayName}
    </Link>
  );
}
