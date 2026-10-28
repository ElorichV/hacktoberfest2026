import { cn } from "@/lib/utils";

export const LOGO = "BENCHENGINE";

/** Static neon wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3 font-display font-semibold", className)}>
      <span className="neon-text text-highlight">Ǝ</span>
      <span className="neon-shimmer tracking-[0.25em]">{LOGO}</span>
    </span>
  );
}
