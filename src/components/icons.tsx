// Hand-rolled inline SVG icons (zero dependencies) — a clean stroke set so the
// UI reads as crafted software, not an emoji-strewn prototype.
import type { ReactNode } from "react";

function Icon({ children, className = "h-3.5 w-3.5" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

type P = { className?: string };

export const IPlus = (p: P) => (
  <Icon className={p.className}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const ITrend = (p: P) => (
  <Icon className={p.className}>
    <polyline points="3 17 9 11 13 15 21 7" />
    <polyline points="15 7 21 7 21 13" />
  </Icon>
);
export const IBot = (p: P) => (
  <Icon className={p.className}>
    <rect x="4" y="9" width="16" height="11" rx="2" />
    <path d="M12 9V5" />
    <circle cx="9" cy="14" r="1" />
    <circle cx="15" cy="14" r="1" />
  </Icon>
);
export const IBell = (p: P) => (
  <Icon className={p.className}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </Icon>
);
export const IBellOff = (p: P) => (
  <Icon className={p.className}>
    <path d="M8.7 3A6 6 0 0 1 18 8c0 3 .6 4.8 1.3 6M5.3 7A6 6 0 0 0 6 8c0 7-3 9-3 9h13" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    <path d="m2 2 20 20" />
  </Icon>
);
export const ISpeaker = (p: P) => (
  <Icon className={p.className}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
  </Icon>
);
export const ISparkle = (p: P) => (
  <Icon className={p.className}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
  </Icon>
);
export const ICamera = (p: P) => (
  <Icon className={p.className}>
    <path d="M14.5 4l1.5 2H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l1.5-2z" />
    <circle cx="12" cy="13" r="3.2" />
  </Icon>
);
export const IPause = (p: P) => (
  <Icon className={p.className}>
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </Icon>
);
export const IPlay = (p: P) => (
  <Icon className={p.className}>
    <polygon points="7 4 20 12 7 20 7 4" />
  </Icon>
);
export const ITrash = (p: P) => (
  <Icon className={p.className}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 13h8l1-13" />
  </Icon>
);
export const IClock = (p: P) => (
  <Icon className={p.className}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15.5 14" />
  </Icon>
);
export const IBan = (p: P) => (
  <Icon className={p.className}>
    <circle cx="12" cy="12" r="9" />
    <path d="m5.6 5.6 12.8 12.8" />
  </Icon>
);
export const IStar = (p: P) => (
  <Icon className={p.className}>
    <polygon points="12 3 14.6 9 21 9.6 16.1 13.9 17.6 20.1 12 16.8 6.4 20.1 7.9 13.9 3 9.6 9.4 9" />
  </Icon>
);
export const IPin = (p: P) => (
  <Icon className={p.className}>
    <path d="M12 17v5" />
    <path d="M9 10.8a2 2 0 0 1-1.1 1.8l-1.8.9A2 2 0 0 0 5 15.2V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.8a2 2 0 0 0-1.1-1.7l-1.8-.9A2 2 0 0 1 15 10.8V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
  </Icon>
);
export const IGlobe = (p: P) => (
  <Icon className={p.className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18" />
  </Icon>
);
