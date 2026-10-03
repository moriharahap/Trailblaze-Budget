import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSubstitutes, getGetSubstitutesQueryKey, useUpdateOwnership,
  getGetLineupsQueryKey, getGetOwnershipQueryKey,
  type SlotRole, type SubstituteCandidate, type OwnershipMap,
} from "@workspace/api-client-react";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { CharIcon } from "@/components/tb-ui";
import { ROLE_LABEL, elementColor, errMsg, getAnonId } from "@/lib/tb";

export interface SheetTarget { role: SlotRole; metaPickId: string | null }

export function SubstituteSheet({ dpsId, target, onClose }: { dpsId: string; target: SheetTarget | null; onClose: () => void }) {
  const anonId = getAnonId();
  const role = (target?.role ?? "support") as SlotRole;
  const params = { anonId };
  const { data, isLoading, isError, refetch } = useGetSubstitutes(dpsId, role, params, {
    query: { enabled: !!target, queryKey: getGetSubstitutesQueryKey(dpsId, role, params) },
  });
  const update = useUpdateOwnership();
  const qc = useQueryClient();
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const initFor = useRef<string | null>(null);

  useEffect(() => {
    if (!target) { initFor.current = null; return; }
    const key = `${role}-${target.metaPickId}`;
    if (data && initFor.current !== key) {
      initFor.current = key;
      setTicked(new Set([...data.pool, ...data.others].filter((c) => c.ownership === "owned").map((c) => c.character.id)));
    }
  }, [data, target, role]);

  const toggle = (id: string) => setTicked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const confirm = () => {
    if (!data) return;
    const map: OwnershipMap = {};
    [...data.pool, ...data.others].forEach((c) => { map[c.character.id] = ticked.has(c.character.id) ? "owned" : "not_owned"; });
    if (target?.metaPickId) map[target.metaPickId] = "not_owned";
    update.mutate({ anonId, data: map }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetLineupsQueryKey(dpsId) });
        qc.invalidateQueries({ queryKey: getGetOwnershipQueryKey(anonId) });
        qc.invalidateQueries({ queryKey: [`/api/substitutes/${dpsId}`] });
        onClose();
      },
    });
  };

  return (
    <Drawer open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="mx-auto max-h-[88dvh] max-w-2xl border-card-border bg-popover">
        <div className="overflow-y-auto px-5 pb-4 pt-2">
          <p className="font-data text-[10px] uppercase tracking-[0.25em] text-primary">Roster check</p>
          <DrawerTitle className="font-display mt-1 text-2xl font-bold">Which {ROLE_LABEL[role]} do you own?</DrawerTitle>
          <DrawerDescription className="mt-1 text-sm text-muted-foreground">
            Tick everyone you have. Unticked means you don't — we'll rebuild every team from this.
          </DrawerDescription>

          {isLoading ? (
            <div className="mt-5 flex flex-wrap gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-36 rounded-full" />)}</div>
          ) : isError ? (
            <p className="mt-5 text-sm">Couldn't load candidates. <button className="text-primary underline" onClick={() => refetch()}>Retry</button></p>
          ) : data ? (
            <>
              <h3 className="font-data mb-2 mt-5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Curated for this DPS</h3>
              {data.pool.length === 0 ? <p className="text-sm text-muted-foreground">No curated substitutes for this role yet.</p> : (
                <div className="flex flex-wrap gap-2">
                  {data.pool.map((c, i) => <CandChip key={c.character.id} c={c} i={i} on={ticked.has(c.character.id)} onClick={() => toggle(c.character.id)} value={c.score} />)}
                </div>
              )}
              {data.others.length > 0 && (
                <Collapsible className="mt-5">
                  <CollapsibleTrigger className="group flex items-center gap-1.5 font-data text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground" data-testid="button-toggle-others">
                    Other {ROLE_LABEL[role]} characters ({data.others.length})
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 flex flex-wrap gap-2">
                    {data.others.map((c, i) => <CandChip key={c.character.id} c={c} i={i} on={ticked.has(c.character.id)} onClick={() => toggle(c.character.id)} value={c.genericScore} />)}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          ) : null}
          {update.isError && <p className="mt-4 text-sm text-destructive">{errMsg(update.error)}</p>}
        </div>
        <div className="flex gap-2 border-t border-border px-5 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-sm" data-testid="button-sheet-cancel">Cancel</button>
          <button onClick={confirm} disabled={!data || update.isPending}
            className="flex-[2] rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50" data-testid="button-sheet-confirm">
            {update.isPending ? "Rebuilding…" : `Confirm · ${ticked.size} owned`}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function CandChip({ c, on, onClick, value, i }: { c: SubstituteCandidate; on: boolean; onClick: () => void; value?: number | null; i: number }) {
  const col = elementColor(c.character);
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
      whileTap={{ scale: 0.9 }} onClick={onClick}
      className="relative flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-left transition-colors"
      style={{ borderColor: on ? col : "hsl(var(--border))", background: on ? `${col}1f` : "hsl(var(--card))" }}
      data-testid={`chip-candidate-${c.character.id}`}
    >
      <CharIcon c={c.character} size={36} dim={!on} className="rounded-full [&>div]:rounded-full" />
      <span className="text-[13px] font-semibold">{c.character.name}</span>
      {value != null && <span className="font-data text-[10px] text-muted-foreground">{value}</span>}
      <motion.span animate={{ scale: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}
        className="grid h-4 w-4 place-items-center rounded-full" style={{ background: col }}>
        <Check className="h-3 w-3 text-[hsl(236_40%_8%)]" strokeWidth={3} />
      </motion.span>
    </motion.button>
  );
}
