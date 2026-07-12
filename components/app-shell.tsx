"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  GitCompareArrows,
  Home,
  Info,
  SquarePlus,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { LogIn, LogOut } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { useDemo } from "@/context/demo-context";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const primaryItems: NavItem[] = [
  { href: "/", label: "Feed", icon: Home },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/publish", label: "Publish", icon: SquarePlus },
  { href: "/saved", label: "Saved", icon: Bookmark },
];

const profileItem: NavItem = { href: "/profile", label: "Profile", icon: UserRound };

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/case/");
  return pathname.startsWith(href);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      className="nav-link"
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      data-active={active || undefined}
      href={item.href}
    >
      <Icon aria-hidden="true" size={20} strokeWidth={1.9} />
      <span>{item.label}</span>
    </Link>
  );
}

function profileLabel(userDisplayName: string | undefined, isDemoSession: boolean, isSignedIn: boolean) {
  if (!isSignedIn) {
    return { initials: "?", name: "Guest" };
  }
  if (isDemoSession) {
    return { initials: "JL", name: "Jordan Lee" };
  }
  const name = userDisplayName?.trim() || "Referee learner";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "RL";
  return { initials, name };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isDemoSession, isSignedIn, signOut } = useDemo();
  const displayName =
    typeof user?.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : undefined;
  const profile = profileLabel(displayName, isDemoSession, isSignedIn);

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
        <nav className="desktop-nav" aria-label="Primary">
          {primaryItems.map((item) => <NavLink item={item} pathname={pathname} key={item.href} />)}
        </nav>
        <div className="sidebar-footer">
          <Link className="profile-control" href="/profile" aria-label="Open learner profile">
            <span className="profile-avatar" aria-hidden="true">{profile.initials}</span>
            <span><strong>{profile.name}</strong></span>
          </Link>
          <Link className="about-link" href="/about">
            <Info aria-hidden="true" size={16} /> <span>About & trust</span>
          </Link>
          {isSignedIn ? (
            <button className="about-link" type="button" onClick={() => void signOut()}>
              <LogOut aria-hidden="true" size={16} /> <span>Sign out</span>
            </button>
          ) : (
            <Link className="about-link" href="/auth" aria-current={pathname.startsWith("/auth") ? "page" : undefined}>
              <LogIn aria-hidden="true" size={16} /> <span>Sign in</span>
            </Link>
          )}
        </div>
      </aside>
      <main id="main-content" className="main-content" tabIndex={-1}>
        {children}
      </main>
      <nav className="mobile-nav" aria-label="Open navigation">
        {primaryItems.slice(0, 2).map((item) => <NavLink item={item} pathname={pathname} key={item.href} />)}
        <Link
          className="mobile-publish"
          aria-current={isActive(pathname, "/publish") ? "page" : undefined}
          href="/publish"
          aria-label="Publish a case"
        >
          <span className="publish-mark" aria-hidden="true"><SquarePlus size={19} /></span>
          <span>Publish</span>
        </Link>
        <NavLink item={primaryItems[3]} pathname={pathname} />
        <NavLink item={profileItem} pathname={pathname} />
      </nav>
    </div>
  );
}
