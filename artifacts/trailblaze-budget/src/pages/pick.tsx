import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useListDps, useUpdateOwnership, getGetOwnershipQueryKey } from "@workspace/api-client-react";
import { CharIcon, SampleBadge, Shell } from "@/components/tb-ui";
import { elementColor, getAnonId } from "@/lib/tb";
import { Skeleton } from "@/components/ui/skeleton";

export default function PickPage() {
  const anonId = getAnonId();
  const { data, isLoading, isError, refetch } = useListDps();
  const update = useUpdateOwnership();
  const qc = useQueryClient();
  const [, nav] = useLocation();
  const [q, setQ] = useState("");
  const [el, setEl] = useState<string | null>(null);

  const elements = useMemo(() => {
    const m = new Map<string, string>();
    (data ?? []).forEach((d) => m.set(d.character.element, elementColor(d.character)));
    return [...m.entries()];
  }, [data]);

  const list = (data ?? []).filter(
    (d) => (!el || d.character.element === el) && d.character.name.toLowerCase().includes(q.toLowerCase()),
  );

  const pick = (id: string) => {
    update.mutate(
      { anonId, data: { [id]: "owned" } },
      { onSettled: () => { qc.invalidateQueries({ queryKey: getGetOwnershipQueryKey(anonId) }); nav(`/dps/${id}`); } },
    );
  };

  return (
    <Shell>
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
        <p className="font-data mb-2 text-[11px] uppercase tracking-[0.25em] text-primary">Step 01 / Your carry</p>
        <h1 className="font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl">
          Who are you<br />building around?
        </h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          Pick the DPS you own. We'll pull the meta teams, then rebuild them around the roster you actually have.
        </p>
      </motion.section>

      <div className="sticky top-0 z-20 -mx-4 mb-5 space-y-3 bg-background/80 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <label className="flex items-center gap-2 rounded-xl border border-input bg-card px-3 py-2.5 focus-within:border-primary">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a character"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" data-testid="input-search" />
        </label>
        {elements.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Chip on={!el} onClick={() => setEl(null)} color="hsl(var(--primary))">All</Chip>
            {elements.map(([name, col]) => (
              <Chip key={name} on={el === name} onClick={() => setEl(el === name ? null : name)} color={col}>{name}</Chip>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-destructive/40 p-6 text-center text-sm">
          The terminal lost signal.{" "}
          <button className="text-primary underline" onClick={() => refetch()} data-testid="button-retry">Retry</button>
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="font-display text-xl font-bold">The archive is empty.</p>
          <p className="mt-2 text-sm text-muted-foreground">No released DPS characters yet. Give a character the DPS role and mark it released in the curation console.</p>
          <Link href="/admin" className="mt-5 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground" data-testid="link-empty-admin">Open curation console</Link>
        </div>
      ) : list.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No one matches that filter.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {list.map((d, i) => (
            <motion.button
              key={d.character.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.035, type: "spring", stiffness: 260, damping: 24 }}
              whileTap={{ scale: 0.95 }}
              disabled={update.isPending}
              onClick={() => pick(d.character.id)}
              className="group relative flex flex-col items-center gap-2 rounded-2xl border border-card-border bg-card/80 p-3 pt-4 text-center transition-colors hover:border-primary/60"
              data-testid={`button-dps-${d.character.id}`}
            >
              <CharIcon c={d.character} size={64} className="transition-transform group-hover:-translate-y-0.5" />
              <span className="line-clamp-1 text-[13px] font-semibold">{d.character.name}</span>
              <span className="font-data text-[10px] text-muted-foreground">{d.lineupCount === 0 ? "No teams yet" : `${d.lineupCount} team${d.lineupCount === 1 ? "" : "s"}`}</span>
              {d.isSample && <SampleBadge />}
            </motion.button>
          ))}
        </div>
      )}
    </Shell>
  );
}

function Chip({ on, onClick, color, children }: { on: boolean; onClick: () => void; color: string; children: string }) {
  return (
    <motion.button whileTap={{ scale: 0.92 }} onClick={onClick}
      className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
      style={{ borderColor: on ? color : "hsl(var(--border))", background: on ? `${color}22` : "transparent", color: on ? color : undefined }}
      data-testid={`chip-element-${children}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />{children}
    </motion.button>
  );
}
