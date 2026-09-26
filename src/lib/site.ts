/**
 * Public site URL. Uses NEXT_PUBLIC_SITE_URL when it's a valid URL, otherwise Vercel's
 * production/deployment domain, otherwise localhost. Blank or malformed values are ignored
 * so a misconfigured env var can't break the build.
 */
function resolveSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];
  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      return new URL(withProtocol).origin;
    } catch {
      // Not a valid URL — try the next candidate.
    }
  }
  return "http://localhost:3000";
}

export const SITE = {
  name: "SnapTranslate",
  url: resolveSiteUrl(),
  title: "Image Translator — Translate Text From Photos Online",
  description:
    "Upload an image and get it back with the text translated into your language. Translate photos, screenshots, documents, signs, menus, and more — online and free.",
  tagline: "Translate text from images quickly, simply, and privately.",
  contactEmail: "hello@snaptranslate.app",
  keywords: [
    "image translator",
    "photo translator",
    "translate image",
    "translate text from image",
    "picture translator",
    "screenshot translator",
    "OCR translator",
    "image to text translator",
  ],
};

export const NAV_LINKS = [
  { href: "/#top", label: "Home" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#features", label: "Features" },
  { href: "/#use-cases", label: "Use Cases" },
  { href: "/#faq", label: "FAQ" },
];
