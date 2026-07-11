"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  GitCompareArrows,
  Home,
  Info,
  Plus,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const primaryItems: NavItem[] = [
  { href: "/", label: "Feed", icon: Home },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/case/");
  return pathname.startsWith(href);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const active = isActive(pathname, item.href);
  return (
    <Link className="nav-link" data-active={active || undefined} href={item.href}>
      <Icon aria-hidden="true" size={19} strokeWidth={1.9} />
      <span>{item.label}</span>
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
      <header className="mobile-topbar">
        <BrandMark />
        <Link className="icon-button" href="/about" aria-label="About ClearCall">
          <Info aria-hidden="true" size={19} />
        </Link>
      </header>
      <aside className="desktop-sidebar" aria-label="Primary navigation">
        <BrandMark />
        <nav className="desktop-nav">
          {primaryItems.map((item) => (
            <NavLink item={item} pathname={pathname} key={item.href} />
          ))}
          <NavLink item={{ href: "/publish", label: "Publish", icon: Plus }} pathname={pathname} />
        </nav>
        <div className="sidebar-footer">
          <Link className="sidebar-user" href="/profile">
            <span className="avatar avatar--lime" aria-hidden="true">JL</span>
            <span>
              <strong>Jordan Lee</strong>
              <small>Referee learner</small>
            </span>
          </Link>
          <Link className="about-link" href="/about">
            <Info aria-hidden="true" size={16} /> About & trust
          </Link>
        </div>
      </aside>
      <main id="main-content" className="main-content" tabIndex={-1}>
        {children}
      </main>
      <nav className="mobile-bottom-nav" aria-label="Primary navigation">
        {primaryItems.slice(0, 2).map((item) => (
          <NavLink item={item} pathname={pathname} key={item.href} />
        ))}
        <Link
          className="mobile-publish"
          data-active={isActive(pathname, "/publish") || undefined}
          href="/publish"
          aria-label="Publish a case"
        >
          <Plus aria-hidden="true" size={24} />
          <span>Publish</span>
        </Link>
        {primaryItems.slice(2).map((item) => (
          <NavLink item={item} pathname={pathname} key={item.href} />
        ))}
      </nav>
    </div>
  );
}
