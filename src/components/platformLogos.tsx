// Real platform brand glyphs (hand-rolled SVG, zero deps) so the multi-platform
// identity reads as polished — used wherever we'd otherwise show a letter chip.
import type { Platform } from "@shared/types";

export function PlatformLogo({ platform, className = "h-4 w-4" }: { platform: Platform; className?: string }) {
  switch (platform) {
    case "twitch":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
          <path d="M4 2 2.5 6v14h4.5v3h2.5l3-3H17l4.5-4.5V2H4Zm15.5 10.5L17 15h-4.5l-2.5 2.5V15H6V4h13.5v8.5Z" />
          <path d="M15 7h2v4.5h-2zM10 7h2v4.5h-2z" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
          <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
          <path d="M17.5 3h3l-6.6 7.5L21.7 21h-5.9l-4.6-6-5.3 6H3l7-8L2.7 3h6l4.2 5.6L17.5 3Zm-1 16h1.6L7.6 4.6H5.9L16.5 19Z" />
        </svg>
      );
    case "kick":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
          <path d="M5 3h4.5v5.5L15 3h5.5l-7 8 7 10H15l-5.5-7.5V21H5V3Z" />
        </svg>
      );
  }
}
