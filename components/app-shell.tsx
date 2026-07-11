"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";

interface NavItem {
  href: string;
  label: string;
}

const primaryItems: NavItem[] = [
  { href: "/", label: "Feed" },
  { href: "/compare", label: "Compare" },
  { href: "/saved", label: "Saved" },
  { href: "/publish", label: "Publish" },
  { href: "/profile", label: "Profile" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/case/");
  return pathname.startsWith(href);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  return (
    <Link className="nav-link" aria-current={active ? "page" : undefined} href={item.href}>
      {item.label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="app-header">
        <BrandMark />
        <nav className="desktop-nav" aria-label="Open navigation">
          {primaryItems.map((item) => <NavLink item={item} pathname={pathname} key={item.href} />)}
        </nav>
        <Link className="profile-control" href="/profile" aria-label="Open learner profile">
          <span className="profile-avatar" aria-hidden="true">JL</span>
          <span><strong>Jordan Lee</strong><small>64.9% calibrated</small></span>
        </Link>
      </header>
      <main id="main-content" className="main-content" tabIndex={-1}>
        {children}
      </main>
      <nav className="mobile-nav" aria-label="Open navigation">
        {primaryItems.map((item) => (
          item.href === "/publish" ? (
            <Link className="mobile-publish" aria-current={isActive(pathname, item.href) ? "page" : undefined} href={item.href} key={item.href}>
              <span className="publish-mark" aria-hidden="true">+</span>{item.label}
            </Link>
          ) : <NavLink item={item} pathname={pathname} key={item.href} />
        ))}
      </nav>
    </div>
  );
}
