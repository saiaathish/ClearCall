export function Avatar({
  initials,
  src,
  size = "md",
  className = "",
}: {
  initials: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass = size === "sm" ? "avatar--small" : size === "lg" ? "avatar--large" : "";
  const classes = ["avatar", sizeClass, className].filter(Boolean).join(" ");
  const pixels = size === "sm" ? 30 : size === "lg" ? 68 : 38;

  if (src) {
    return (
      <span className={`${classes} avatar--photo`} aria-hidden="true">
        {/* Local geometric avatars are SVG; plain img avoids next/image SVG limits. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" className="avatar__image" height={pixels} src={src} width={pixels} />
      </span>
    );
  }

  return (
    <span className={classes} aria-hidden="true">
      {initials}
    </span>
  );
}
