import clsx from "clsx";
import type { BadgeInfo } from "@shared/types";

const STYLES: Record<string, string> = {
  broadcaster: "bg-red-500/20 text-red-300 ring-red-500/40",
  moderator: "bg-green-500/20 text-green-300 ring-green-500/40",
  vip: "bg-pink-500/20 text-pink-300 ring-pink-500/40",
  subscriber: "bg-indigo-500/20 text-indigo-300 ring-indigo-500/40",
  member: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/40",
  verified: "bg-sky-500/20 text-sky-300 ring-sky-500/40",
  sub_gifter: "bg-amber-500/20 text-amber-300 ring-amber-500/40",
  founder: "bg-amber-500/20 text-amber-200 ring-amber-500/40",
  og: "bg-teal-500/20 text-teal-200 ring-teal-500/40",
  staff: "bg-zinc-500/20 text-zinc-200 ring-zinc-500/40",
  unknown: "bg-zinc-600/20 text-zinc-300 ring-zinc-600/40",
};

export function Badge({ badge }: { badge: BadgeInfo }) {
  const cls = STYLES[badge.type] ?? STYLES.unknown;
  const text = badge.type === "verified" ? "✓" : badge.label;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded px-1 py-[1px] text-[10px] font-semibold uppercase leading-none tracking-wide ring-1",
        cls,
      )}
    >
      {text}
      {badge.count ? <span className="ml-0.5 opacity-70">{badge.count}</span> : null}
    </span>
  );
}
