"use client";

import { Globe, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LanguageSelect } from "@/components/translator/LanguageSelect";
import { setPreferredTarget, usePreferredTarget } from "@/lib/preferences";
import { NAV_LINKS } from "@/lib/site";
import { Logo } from "./Logo";
import { btn } from "./ui";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const target = usePreferredTarget();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors ${
        scrolled || open ? "border-line bg-white/85 backdrop-blur-lg" : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="SnapTranslate home" className="rounded-lg">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={`${btn.ghost} text-sm`}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex items-center gap-1.5" title="Default language to translate into">
            <Globe className="size-4 text-ink-muted" aria-hidden="true" />
            <div className="w-40">
              <LanguageSelect
                id="header-target"
                label="Default translation language"
                hideLabel
                compact
                value={target}
                onChange={setPreferredTarget}
              />
            </div>
          </div>
          <Link href="/#translate" className={`${btn.primary} px-4 py-2.5 text-sm`}>
            Translate an Image
          </Link>
        </div>

        <button
          type="button"
          className={`${btn.icon} lg:hidden`}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-line bg-white px-4 pb-6 pt-2 lg:hidden">
          <nav aria-label="Mobile">
            <ul className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-3 font-medium text-ink hover:bg-surface"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-4 space-y-4 px-3">
            <LanguageSelect
              id="mobile-target"
              label="Default translation language"
              value={target}
              onChange={setPreferredTarget}
            />
            <Link href="/#translate" onClick={() => setOpen(false)} className={`${btn.primary} w-full`}>
              Translate an Image
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
