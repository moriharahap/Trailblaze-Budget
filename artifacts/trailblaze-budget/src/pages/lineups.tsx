import { useState, type ReactNode } from "react";
import { Link, useParams } from "wouter";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, AlertTriangle, Sparkles, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetLineups, getGetLineupsQueryKey, useUpdateOwnership, getGetOwnershipQueryKey, useExplainLineup,
  type ResolvedLineup, type ResolvedSlot,
} from "@workspace/api-client-react";
import { CharIcon, SampleBadge, Shell } from "@/components/tb-ui";
import { SubstituteSheet, type SheetTarget } from "@/components/substitute-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABEL, errMsg, getAnonId } from "@/lib/tb";
import { cn } from "@/lib/utils";

export default function LineupsPage() {
  const { dpsId = "" } = useParams<{ dpsId: string }>();
  const anonId = getAnonId();
  const params = { anonId };
  const { data, isLoading, isError, error, refetch } = useGetLineups(dpsId, params, {
    query: { enabled: !!dpsId, queryKey: getGetLineupsQueryKey(dpsId, params) },
  });
  const [target, setTarget] = useState<SheetTarget | null>(null);

  return (
    <Shell>
      <Link href="/" className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground" data-testid="link-back">
        <ArrowLeft className="h-3.5 w-3.5" /> Change DPS
      </Link>
      {isLoading ? (
        <div className="space-y-4"><Skeleton className="h-24 rounded-3xl" />{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}</div>
      ) : isError || !data ? (
        <div className="rounded-2xl border border-destructive/40 p-6 text-center text-sm">
          {errMsg(error)} <button className="ml-1 text-primary underline" onClick={() => refetch()} data-testid="button-retry">Retry</button>
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-7 flex items-center gap-4">
            <CharIcon c={data.dps} size={76} />
            <div>
              <p className="font-data text-[11px] uppercase tracking-[0.25em] text-primary">Step 02 / Rebuild</p>
              <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{data.dps.name}</h1>
              <p className="text-xs text-muted-foreground">{data.dps.element} · {data.dps.path} · {data.lineups.length} curated team{data.lineups.length === 1 ? "" : "s"}</p>
            </div>
          </motion.div>
          {data.lineups.length === 0 ? (
            <div className="rounded-3xl border border-dashed p-10 text-center text-sm text-muted-foreground">No curated lineups for this DPS yet.</div>
          ) : (
            <LayoutGroup>
              <div className="space-y-4">
                {data.lineups.slice(0, 5).map((l, i) => (
                  <LineupCard key={l.lineupId} l={l} pos={i + 1} dpsId={dpsId} onSheet={setTarget} />
                ))}
              </div>
            </LayoutGroup>
          )}
        </>
      )}
      <SubstituteSheet dpsId={dpsId} target={target} onClose={() => setTarget(null)} />
    </Shell>
  );
}

function LineupCard({ l, pos, dpsId, onSheet }: { l: ResolvedLineup; pos: number; dpsId: string; onSheet: (t: SheetTarget) => void }) {
  const anonId = getAnonId();
  const qc = useQueryClient();
  const update = useUpdateOwnership();
  const explain = useExplainLineup();
  const pct = Math.max(0, Math.min(100, Math.round(l.completeness)));
  const barCol = pct >= 85 ? "hsl(var(--primary))" : pct >= 60 ? "hsl(28 90% 62%)" : "hsl(var(--accent))";

  const have = (id: string) =>
    update.mutate({ anonId, data: { [id]: "owned" } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetLineupsQueryKey(dpsId) });
        qc.invalidateQueries({ queryKey: getGetOwnershipQueryKey(anonId) });
      },
    });

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ layout: { type: "spring", stiffness: 220, damping: 28 }, delay: pos * 0.06 }}
      className="relative overflow-hidden rounded-3xl border border-card-border bg-card/90 backdrop-blur"
      data-testid={`card-lineup-${l.lineupId}`}
    >
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="font-display grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-xl font-extrabold text-primary">
          {pos}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-bold leading-tight">{l.title}</h2>
            {l.isSample && <SampleBadge />}
          </div>
          {l.originalRank !== pos && (
            <p className="font-data mt-0.5 text-[10px] text-muted-foreground">meta rank #{l.originalRank} · moved {l.originalRank > pos ? "up" : "down"} for your roster</p>
          )}
        </div>
        <div className="text-right">
          <motion.div key={pct} initial={{ scale: 1.25, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="font-data text-xl font-semibold" style={{ color: barCol }}>{pct}</motion.div>
          <div className="font-data text-[9px] uppercase tracking-widest text-muted-foreground">complete</div>
        </div>
      </div>
      <div className="mx-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div className="h-full origin-left rounded-full" style={{ background: barCol }}
          initial={{ scaleX: 0 }} animate={{ scaleX: pct / 100 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
      </div>

      <div className="grid grid-cols-4 gap-2 px-4 pt-4">
        <TeamIcon label="DPS" content={<CharIcon c={l.dps} size={56} />} name={l.dps.name} />
        {l.slots.map((s, i) => (
          <TeamIcon key={i} label={ROLE_LABEL[s.role]} name={s.status === "needs_input" ? "Missing" : (s.finalPick ?? s.metaPick).name}
            content={s.status === "needs_input" || !s.finalPick ? (
              <button onClick={() => onSheet({ role: s.role, metaPickId: s.metaPick.id })}
                className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-dashed border-accent/60 text-accent" data-testid={`button-empty-slot-${l.lineupId}-${i}`}>
                <Plus className="h-5 w-5" />
              </button>
            ) : <CharIcon c={s.finalPick} size={56} />} />
        ))}
      </div>

      <div className="space-y-2 p-4">
        {l.slots.map((s, i) => (
          <SlotRow key={i} s={s} idx={i} lid={l.lineupId} busy={update.isPending}
            onHave={() => have(s.metaPick.id)} onDont={() => onSheet({ role: s.role, metaPickId: s.metaPick.id })} />
        ))}
      </div>

      <div className="border-t border-border/60 px-4 py-3">
        <AnimatePresence mode="wait">
          {explain.data ? (
            <motion.p key="ex" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="whitespace-pre-line text-[13px] leading-relaxed text-foreground/85" data-testid={`text-explanation-${l.lineupId}`}>
              {explain.data.explanation}
            </motion.p>
          ) : (
            <motion.div key="btn" className="flex items-center justify-between gap-3">
              <button onClick={() => explain.mutate({ data: { lineup: l } })} disabled={explain.isPending}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"
                data-testid={`button-explain-${l.lineupId}`}>
                <Sparkles className={cn("h-3.5 w-3.5", explain.isPending && "animate-spin")} />
                {explain.isPending ? "Consulting the Express…" : "Explain this team"}
              </button>
              {explain.isError && <span className="text-[11px] text-destructive">Explanation unavailable right now.</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

function TeamIcon({ label, content, name }: { label: string; content: ReactNode; name: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      {content}
      <span className="line-clamp-1 text-[11px] font-semibold">{name}</span>
      <span className="font-data text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

function SlotRow({ s, idx, lid, busy, onHave, onDont }: { s: ResolvedSlot; idx: number; lid: number; busy: boolean; onHave: () => void; onDont: () => void }) {
  const replaced = s.status === "substituted" || s.status === "weak" || s.status === "needs_input";
  return (
    <div className={cn("rounded-2xl border bg-background/40 p-3", s.status === "weak" || s.status === "needs_input" ? "border-accent/30" : "border-border/70")}>
      <div className="flex items-center gap-3">
        <CharIcon c={s.metaPick} size={36} dim={replaced} />
        {replaced && (
          <>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            {s.finalPick ? <CharIcon c={s.finalPick} size={36} /> : <span className="grid h-9 w-9 place-items-center rounded-xl border border-dashed border-accent/60 text-accent"><Plus className="h-4 w-4" /></span>}
          </>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold">
            {replaced ? <><span className="text-muted-foreground line-through">{s.metaPick.name}</span> {s.finalPick ? s.finalPick.name : ""}</> : s.metaPick.name}
          </p>
          <p className="font-data text-[10px] uppercase tracking-wider text-muted-foreground">
            {ROLE_LABEL[s.role]}
            {s.status === "unconfirmed" && <span className="ml-1.5 text-primary/80">· unconfirmed</span>}
            {s.status === "substituted" && <span className="ml-1.5">· substitute · {s.score}</span>}
          </p>
        </div>
        <div className="flex shrink-0 overflow-hidden rounded-full border border-border text-[11px] font-semibold">
          <button onClick={onHave} disabled={busy}
            className={cn("px-3 py-1.5 transition-colors", s.metaOwnership === "owned" ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}
            data-testid={`button-have-${lid}-${idx}`}>Have</button>
          <button onClick={onDont}
            className={cn("border-l border-border px-3 py-1.5 transition-colors", s.metaOwnership === "not_owned" ? "bg-accent text-accent-foreground" : "hover:bg-secondary")}
            data-testid={`button-donthave-${lid}-${idx}`}>Don't have</button>
        </div>
      </div>
      {s.status === "weak" && (
        <p className="mt-2 flex gap-1.5 text-[12px] text-accent">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Weak fallback: you own none of the curated substitutes, so this is your best-rated {ROLE_LABEL[s.role]}.
        </p>
      )}
      {s.status === "needs_input" && (
        <button onClick={onDont} className="mt-2 text-left text-[12px] text-accent underline-offset-2 hover:underline" data-testid={`button-tell-${lid}-${idx}`}>
          We don't know any {ROLE_LABEL[s.role]} you own. Tell us who you have.
        </button>
      )}
      {(s.lossNote || s.fixNote) && replaced && (
        <div className="mt-2 space-y-1 border-l-2 border-primary/40 pl-3 text-[12px] leading-snug">
          {s.lossNote && <p><span className="font-data text-[10px] uppercase tracking-wider text-accent">Lose · </span>{s.lossNote}</p>}
          {s.fixNote && <p><span className="font-data text-[10px] uppercase tracking-wider text-primary">Fix · </span>{s.fixNote}</p>}
        </div>
      )}
    </div>
  );
}
