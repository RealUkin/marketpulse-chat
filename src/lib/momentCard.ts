"use client";
// Shareable "chat moment" card — renders recent chat into a vertical 9:16 PNG
// you can post to X/TikTok. Pure canvas, keyless, no dependencies.
import type { UnifiedMessage } from "@shared/types";
import { PLATFORM_META } from "@/lib/platform";

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines) {
    // ellipsize the last line if it's likely cut off
    let last = lines[maxLines - 1];
    while (last && ctx.measureText(`${last}…`).width > maxW) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

function renderMomentCanvas(messages: UnifiedMessage[], accentRgb: string): HTMLCanvasElement | null {
  const picked = messages.filter((m) => !m.event && m.text.trim()).slice(-8);
  if (picked.length === 0) return null;

  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const rgb = accentRgb.replaceAll(" ", ",");

  // background + accent glow
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0b0b12");
  bg.addColorStop(1, "#14111d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 760);
  glow.addColorStop(0, `rgba(${rgb},0.22)`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 760);

  // header
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 66px Inter, system-ui, sans-serif";
  ctx.fillText("MarketPulse", 80, 158);
  ctx.fillStyle = `rgb(${rgb})`;
  ctx.font = "700 30px Inter, system-ui, sans-serif";
  ctx.fillText("● CHAT MOMENT", 84, 210);

  // messages
  let y = 330;
  for (const m of picked) {
    const meta = PLATFORM_META[m.platform];
    ctx.beginPath();
    ctx.arc(98, y - 13, 13, 0, Math.PI * 2);
    ctx.fillStyle = meta.color;
    ctx.fill();

    ctx.font = "800 40px Inter, system-ui, sans-serif";
    ctx.fillStyle = m.color ?? meta.color;
    ctx.fillText(m.displayName.slice(0, 22), 138, y);

    ctx.font = "400 40px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#e7e7ec";
    const lines = wrap(ctx, m.text, W - 220, 3);
    let ty = y + 54;
    for (const ln of lines) {
      ctx.fillText(ln, 138, ty);
      ty += 50;
    }
    y = ty + 38;
    if (y > H - 180) break;
  }

  // footer
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "600 30px Inter, system-ui, sans-serif";
  ctx.fillText("one live feed — twitch · kick · youtube · x", 80, H - 88);

  return canvas;
}

export function downloadMomentCard(messages: UnifiedMessage[], accentRgb: string): void {
  const canvas = renderMomentCanvas(messages, accentRgb);
  if (!canvas) return;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "marketpulse-moment.png";
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
