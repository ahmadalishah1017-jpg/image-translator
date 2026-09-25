import { ImageResponse } from "next/og";

export const alt = "SnapTranslate — Translate text from photos online";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #ffffff 0%, #eef2ff 60%, #f3e8ff 100%)",
          color: "#0b1437",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 32 32">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#2563eb" />
                <stop offset="1" stopColor="#8b3df0" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="9" fill="url(#g)" />
            <rect x="6.5" y="7.5" width="14" height="12" rx="2.5" fill="none" stroke="#fff" strokeWidth="2" />
            <path d="M8.8 17.2l3.3-3.6 2.4 2.4 1.6-1.6 2.6 2.8" fill="none" stroke="#fff" strokeWidth="1.6" />
            <path d="M25.5 15.5a6.5 6.5 0 0 1-6.3 9" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <path d="M21.4 22.2l-2.4 2.3 2.6 2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <path d="M23.6 13.4l2 2.3 2.2-2.1" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 40, fontWeight: 800 }}>SnapTranslate</div>
        </div>
        <div style={{ marginTop: 48, fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
          Translate Any Image in Seconds
        </div>
        <div style={{ marginTop: 28, fontSize: 32, color: "#4a5578" }}>
          Photos · Screenshots · Documents · Signs · Menus
        </div>
      </div>
    ),
    size,
  );
}
