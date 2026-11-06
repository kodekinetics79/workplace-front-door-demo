"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function NavLinks({ items, note }: { items: { href: string; label: string; count?: number }[]; note: string }) {
  const path = usePathname();
  return (
    <nav className="c-nav" aria-label="Console sections">
      {items.map((i) => {
        const on = i.href === "/staff" ? path === "/staff" : path.startsWith(i.href);
        return <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined}><span>{i.label}</span>{i.count ? <span className="count">{i.count}</span> : null}</Link>;
      })}
      <div className="role-note">{note}</div>
    </nav>
  );
}
