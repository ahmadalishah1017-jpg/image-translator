/** Shared class strings — keeps buttons and cards consistent without a component library. */

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50";

export const btn = {
  primary: `${base} bg-brand-gradient px-5 py-3 text-white shadow-lift hover:brightness-110 active:brightness-95`,
  secondary: `${base} border border-line bg-white px-4 py-2.5 text-ink shadow-sm hover:border-brand-100 hover:bg-brand-50`,
  ghost: `${base} px-3 py-2 text-ink-soft hover:bg-surface hover:text-ink`,
  small: `${base} border border-line bg-white px-3 py-1.5 text-sm text-ink-soft hover:border-brand-100 hover:bg-brand-50 hover:text-ink`,
  icon: `${base} size-9 rounded-lg text-ink-soft hover:bg-surface hover:text-ink`,
};

export const card = "rounded-2xl border border-line bg-white shadow-card";

export const sectionTitle = "text-3xl font-extrabold tracking-tight text-ink sm:text-4xl";
export const sectionLead = "mt-4 text-lg leading-relaxed text-ink-soft";
export const eyebrow = "text-sm font-bold uppercase tracking-widest text-brand-600";
