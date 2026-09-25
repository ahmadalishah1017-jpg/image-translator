import { useId } from "react";

/** Photo frame + circular translation arrows. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#8b3df0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id})`} />
      <rect x="6.5" y="7.5" width="14" height="12" rx="2.5" fill="none" stroke="#fff" strokeWidth="2" />
      <path
        d="M8.8 17.2l3.3-3.6 2.4 2.4 1.6-1.6 2.6 2.8"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16.6" cy="11.2" r="1.3" fill="#fff" />
      <path d="M25.5 15.5a6.5 6.5 0 0 1-6.3 9" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M21.4 22.2l-2.4 2.3 2.6 2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23.6 13.4l2 2.3 2.2-2.1" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="text-lg font-extrabold tracking-tight text-ink">
        Snap<span className="text-brand-gradient">Translate</span>
      </span>
    </span>
  );
}
