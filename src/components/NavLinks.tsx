"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Learn" },
  { href: "/explore", label: "Explore" },
  { href: "/toolkit", label: "Toolkit" },
  { href: "/practice", label: "Practice" },
] as const;

export function NavLinks({ showProfile }: { showProfile: boolean }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex flex-wrap items-center gap-1 text-sm">
      {LINKS.map((link) => {
        const active = isActive(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-2.5 py-1.5 transition-colors ${
              active
                ? "bg-accent-soft font-semibold text-accent"
                : "font-medium text-muted hover:text-ink"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
      {showProfile ? (
        <Link
          href="/profile"
          className={`rounded-md px-2.5 py-1.5 transition-colors ${
            isActive("/profile")
              ? "bg-accent-soft font-semibold text-accent"
              : "font-medium text-muted hover:text-ink"
          }`}
        >
          Profile
        </Link>
      ) : null}
    </div>
  );
}
