import type { ReactNode } from "react";
import { Link } from "wouter";
import type { CharacterSummary } from "@workspace/api-client-react";
import { elementColor } from "@/lib/tb";
import { cn } from "@/lib/utils";

export function CharIcon({
  c,
  size = 56,
  dim = false,
  className,
}: {
  c: CharacterSummary;
  size?: number;
  dim?: boolean;
  className?: string;
}) {
  const col = elementColor(c);
  return (
    <div
      className={cn("relative shrink-0 rounded-2xl p-[2px] transition-all", dim && "grayscale opacity-45", className)}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(145deg, ${col}, ${col}33 60%, transparent)`,
      }}
      title={`${c.name} · ${c.element} · ${c.path}`}
    >
      <div className="h-full w-full overflow-hidden rounded-[14px] bg-[hsl(236_30%_12%)]">
        <img src={c.iconUrl} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <span
        className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[hsl(var(--card))]"
        style={{ background: col }}
      />
    </div>
  );
}

export function SampleBadge() {
  return (
    <span className="font-data rounded-md border border-dashed border-accent/60 px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.18em] text-accent">
      SAMPLE
    </span>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-[100dvh]">
      <div className="stars" />
      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-3xl flex-col px-4 pb-10 pt-5 sm:px-6">
        <header className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" data-testid="link-home">
            <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z" /></svg>
            </span>
            <span className="font-display text-[15px] font-bold tracking-tight">
              Trailblaze <span className="text-primary">Budget</span>
            </span>
          </Link>
          <span className="font-data text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Express Terminal</span>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mt-14 flex items-center justify-between border-t border-border/60 pt-4 text-[11px] text-muted-foreground">
          <span className="font-data">F2P lineups, rebuilt honestly.</span>
          <Link href="/admin" className="font-data opacity-50 hover:opacity-100" data-testid="link-admin">curation</Link>
        </footer>
      </div>
    </div>
  );
}
