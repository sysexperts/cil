"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Übersicht", icon: "▧" },
  { href: "/rechnungen", label: "Rechnungen", icon: "🧾" },
  { href: "/produkte", label: "Produkte", icon: "📦" },
  { href: "/lieferanten", label: "Lieferanten", icon: "🚚" },
  { href: "/auswertung", label: "Auswertung", icon: "📈" },
  { href: "/einstellungen", label: "Einstellungen", icon: "⚙️" },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sidebar">
      <div className="brand">
        <Image src="/ciloglu-logo.png" alt="Ciloglu" width={100} height={48} priority />
      </div>
      <nav className="nav">
        {nav.map((n) => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} className={active ? "active" : ""}>
              <span className="nav-icon" aria-hidden>{n.icon}</span> {n.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
