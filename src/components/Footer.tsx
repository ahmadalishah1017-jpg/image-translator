import { Mail, Rss } from "lucide-react";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { Logo } from "./Logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/", label: "Home" },
      { href: "/#features", label: "Features" },
      { href: "/#how-it-works", label: "How It Works" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link href="/" aria-label="SnapTranslate home" className="inline-block rounded-lg">
              <Logo />
            </Link>
            <p className="mt-4 max-w-xs text-ink-soft">{SITE.tagline}</p>
            <div className="mt-5 flex gap-2">
              <a
                href={`mailto:${SITE.contactEmail}`}
                aria-label="Email us"
                className="grid size-9 place-items-center rounded-lg border border-line bg-white text-ink-soft hover:text-ink"
              >
                <Mail className="size-4" />
              </a>
              <a
                href="/blog"
                aria-label="Blog"
                className="grid size-9 place-items-center rounded-lg border border-line bg-white text-ink-soft hover:text-ink"
              >
                <Rss className="size-4" />
              </a>
            </div>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-sm font-bold text-ink">{col.title}</h2>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-ink-soft transition hover:text-brand-600">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-sm text-ink-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} SnapTranslate. All rights reserved.</p>
          <p>OCR runs in your browser. Translations are machine-generated and may contain errors.</p>
        </div>
      </div>
    </footer>
  );
}
