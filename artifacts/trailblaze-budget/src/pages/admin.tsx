import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowDown, ArrowUp, RefreshCw, Trash2, Plus, Save, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSyncStatus, getGetSyncStatusQueryKey, useRunSync,
  useListAdminCharacters, getListAdminCharactersQueryKey, useUpdateCharacterMeta, useBulkUpdateCharacterMeta,
  useListDpsCoverage, getListDpsCoverageQueryKey,
  useListAdminLineups, getListAdminLineupsQueryKey, useCreateLineup, useUpdateLineup, useDeleteLineup,
  useListAdminSubstitutes, getListAdminSubstitutesQueryKey, useUpsertSubstitutePool, useDeleteSubstitutePool,
  getListDpsQueryKey,
  type AdminCharacter, type Role, type SlotRole, type Lineup, type LineupSlot, type SubstituteOption, type SubstitutePool,
} from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CharIcon, SampleBadge, Shell } from "@/components/tb-ui";
import { ROLE_LABEL, errMsg } from "@/lib/tb";
import { cn } from "@/lib/utils";

const ROLES: Role[] = ["dps", "sub_dps", "support", "sustain"];
const SLOT_ROLES: SlotRole[] = ["sub_dps", "support", "sustain"];
const inputCls = "rounded-lg border border-input bg-background/60 px-2.5 py-1.5 text-sm outline-none focus:border-primary";

function useInvalidateAdmin() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: getGetSyncStatusQueryKey() });
    qc.invalidateQueries({ queryKey: getListAdminCharactersQueryKey() });
    qc.invalidateQueries({ queryKey: getListDpsCoverageQueryKey() });
    qc.invalidateQueries({ queryKey: getListAdminLineupsQueryKey() });
    qc.invalidateQueries({ queryKey: getListAdminSubstitutesQueryKey() });
    qc.invalidateQueries({ queryKey: getListDpsQueryKey() });
  };
}

export default function AdminPage() {
  const [dpsId, setDpsId] = useState<string | null>(null);
  const [tab, setTab] = useState("sync");
  return (
    <Shell>
      <p className="font-data text-[11px] uppercase tracking-[0.25em] text-accent">Conductor's console</p>
      <h1 className="font-display mb-5 text-3xl font-extrabold tracking-tight">Curation</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-5 flex h-auto w-full flex-wrap justify-start gap-1 bg-card p-1">
          {[["sync", "Sync"], ["review", "Characters"], ["coverage", "Coverage"], ["lineups", "Lineups"], ["subs", "Substitutes"]].map(([v, l]) => (
            <TabsTrigger key={v} value={v} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid={`tab-${v}`}>{l}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="sync"><SyncPanel /></TabsContent>
        <TabsContent value="review"><CharactersPanel /></TabsContent>
        <TabsContent value="coverage"><CoveragePanel onPick={(id) => { setDpsId(id); setTab("lineups"); }} /></TabsContent>
        <TabsContent value="lineups"><DpsSelect value={dpsId} onChange={setDpsId} />{dpsId && <LineupsEditor dpsId={dpsId} />}</TabsContent>
        <TabsContent value="subs"><DpsSelect value={dpsId} onChange={setDpsId} />{dpsId && <SubsEditor dpsId={dpsId} />}</TabsContent>
      </Tabs>
    </Shell>
  );
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-card-border bg-card/90 p-4", className)}>{children}</div>;
}

function SyncPanel() {
  const { data, isLoading, isError, refetch } = useGetSyncStatus();
  const sync = useRunSync();
  const inv = useInvalidateAdmin();
  if (isLoading) return <Skeleton className="h-60 rounded-2xl" />;
  if (isError || !data) return <Panel>Couldn't load status. <button className="text-primary underline" onClick={() => refetch()}>Retry</button></Panel>;
  const fmt = (s?: string | null) => (s ? new Date(s).toLocaleString() : "never");
  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Stat k="Last sync" v={fmt(data.lastSyncAt)} />
          <Stat k="Last attempt" v={`${fmt(data.lastAttemptAt)} · ${data.lastAttemptOk == null ? "—" : data.lastAttemptOk ? "ok" : "failed"}`} />
          <Stat k="Source" v={data.source ?? "none"} />
          <Stat k="Characters" v={String(data.characterCount)} />
        </div>
        {data.lastError && <p className="mt-3 text-xs text-destructive">{data.lastError}</p>}
        {!data.pearlPresent && (
          <p className="mt-3 flex gap-2 rounded-lg border border-accent/40 bg-accent/10 p-2 text-xs text-accent"><AlertTriangle className="h-4 w-4" />Self-check failed: expected character 1503 is missing. Data may be stale.</p>
        )}
        <button onClick={() => sync.mutate(undefined, { onSettled: inv })} disabled={sync.isPending}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60" data-testid="button-sync">
          <RefreshCw className={cn("h-4 w-4", sync.isPending && "animate-spin")} />{sync.isPending ? "Syncing…" : "Sync game data"}
        </button>
        {sync.isError && <p className="mt-2 text-xs text-destructive">{errMsg(sync.error)}</p>}
      </Panel>
      <Panel>
        <h3 className="font-data mb-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Newest 10 by ID</h3>
        <div className="grid grid-cols-5 gap-3">
          {data.highestIds.map((c) => (
            <div key={c.id} className="flex flex-col items-center gap-1 text-center"><CharIcon c={c} size={48} /><span className="line-clamp-1 text-[10px]">{c.name}</span></div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return <div><div className="font-data text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div><div className="font-medium">{v}</div></div>;
}

function CharactersPanel() {
  const [filter, setFilter] = useState<"needs_review" | "all">("needs_review");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const { data, isLoading } = useListAdminCharacters({ filter });
  const list = (data ?? []).filter((c) => c.character.name.toLowerCase().includes(q.toLowerCase()));
  const shownIds = list.map((c) => c.character.id);
  const allShownSelected = shownIds.length > 0 && shownIds.every((id) => selected.has(id));
  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAllShown = () => setSelected((prev) => {
    const next = new Set(prev);
    if (allShownSelected) shownIds.forEach((id) => next.delete(id)); else shownIds.forEach((id) => next.add(id));
    return next;
  });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["needs_review", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn("rounded-full border px-3 py-1.5 text-xs", filter === f ? "border-primary bg-primary/15 text-primary" : "border-border")} data-testid={`button-filter-${f}`}>
            {f === "all" ? "All" : "Needs review"}
          </button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className={cn(inputCls, "flex-1")} data-testid="input-admin-search" />
      </div>
      {list.length > 0 && (
        <div className="flex items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox checked={allShownSelected} onCheckedChange={toggleAllShown} data-testid="checkbox-select-all" />
            Select all shown ({shownIds.length})
          </label>
          {selected.size > 0 && (
            <button onClick={() => setSelected(new Set())} className="underline-offset-2 hover:text-foreground hover:underline" data-testid="button-clear-selection">Clear selection</button>
          )}
        </div>
      )}
      {notice && selected.size === 0 && (
        <p className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary" data-testid="text-bulk-success">{notice}</p>
      )}
      {selected.size > 0 && <BulkBar ids={[...selected]} onDone={(n) => { setNotice(`Updated ${n} character${n === 1 ? "" : "s"}.`); setSelected(new Set()); }} />}
      {isLoading ? <Skeleton className="h-40 rounded-2xl" /> : list.length === 0 ? (
        <Panel className="text-center text-sm text-muted-foreground">{filter === "needs_review" ? "Nothing needs review. Clean archive." : "No characters."}</Panel>
      ) : list.map((c) => (
        <CharEditor key={`${c.character.id}:${c.roles.join(",")}:${c.isReleased}:${c.genericScore}`} c={c}
          selected={selected.has(c.character.id)} onToggle={() => toggle(c.character.id)} />
      ))}
    </div>
  );
}

type ReleaseChoice = "keep" | "released" | "unreleased";

function BulkBar({ ids, onDone }: { ids: string[]; onDone: (count: number) => void }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [mode, setMode] = useState<"add" | "replace">("add");
  const [release, setRelease] = useState<ReleaseChoice>("keep");
  const [error, setError] = useState<string | null>(null);
  const bulk = useBulkUpdateCharacterMeta();
  const inv = useInvalidateAdmin();
  // "Add" with no roles changes nothing; "Replace" with no roles clears roles on purpose.
  const touchesRoles = mode === "replace" || roles.length > 0;
  const canApply = (touchesRoles || release !== "keep") && !bulk.isPending;
  const apply = () => {
    setError(null);
    bulk.mutate({
      data: {
        characterIds: ids,
        ...(touchesRoles ? { roles, rolesMode: mode } : {}),
        ...(release !== "keep" ? { isReleased: release === "released" } : {}),
      },
    }, {
      onSuccess: (rows) => {
        inv();
        onDone(rows.length);
      },
      onError: (err) => setError(errMsg(err)),
    });
  };
  const seg = (on: boolean) => cn("px-2.5 py-1 text-xs transition-colors", on ? "bg-primary text-primary-foreground" : "hover:bg-secondary");
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      className="sticky top-2 z-20 space-y-3 rounded-2xl border border-primary/50 bg-card/95 p-4 shadow-lg backdrop-blur" data-testid="panel-bulk">
      <div className="font-data text-[11px] uppercase tracking-[0.2em] text-primary">Bulk edit · {ids.length} selected</div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-14 text-xs text-muted-foreground">Roles</span>
        {ROLES.map((r) => {
          const on = roles.includes(r);
          return <motion.button whileTap={{ scale: 0.9 }} key={r} onClick={() => setRoles(on ? roles.filter((x) => x !== r) : [...roles, r])}
            className={cn("rounded-full border px-2.5 py-1 text-xs", on ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground")} data-testid={`chip-bulk-role-${r}`}>{ROLE_LABEL[r]}</motion.button>;
        })}
        <div className="flex overflow-hidden rounded-full border border-border">
          <button onClick={() => setMode("add")} className={seg(mode === "add")} data-testid="button-bulk-mode-add">Add</button>
          <button onClick={() => setMode("replace")} className={cn(seg(mode === "replace"), "border-l border-border")} data-testid="button-bulk-mode-replace">Replace</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-14 text-xs text-muted-foreground">Released</span>
        <div className="flex overflow-hidden rounded-full border border-border">
          {([["keep", "Leave as is"], ["released", "Released"], ["unreleased", "Unreleased"]] as const).map(([v, l], i) => (
            <button key={v} onClick={() => setRelease(v)} className={cn(seg(release === v), i > 0 && "border-l border-border")} data-testid={`button-bulk-release-${v}`}>{l}</button>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {mode === "replace"
          ? roles.length === 0 ? "Replace with no roles clears every selected character's roles." : "Selected characters will have exactly these roles."
          : roles.length === 0 ? "Pick roles to add, or only change released status." : "These roles are added to each character's existing roles."}
        {" "}Generic scores are not changed.
      </p>
      <div className="flex items-center gap-3">
        <button onClick={apply} disabled={!canApply}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50" data-testid="button-bulk-apply">
          <Save className="h-3.5 w-3.5" />{bulk.isPending ? "Applying…" : `Apply to ${ids.length}`}
        </button>
        {error && <span className="text-xs text-destructive" data-testid="text-bulk-error">{error}</span>}
      </div>
    </motion.div>
  );
}

function CharEditor({ c, selected, onToggle }: { c: AdminCharacter; selected: boolean; onToggle: () => void }) {
  const [roles, setRoles] = useState<Role[]>(c.roles);
  const [score, setScore] = useState<string>(c.genericScore?.toString() ?? "");
  const [rel, setRel] = useState(c.isReleased);
  const upd = useUpdateCharacterMeta();
  const inv = useInvalidateAdmin();
  const save = () => upd.mutate({ characterId: c.character.id, data: { roles, genericScore: score === "" ? null : Number(score), isReleased: rel } }, { onSuccess: inv });
  return (
    <Panel className={cn("space-y-3", selected && "border-primary/60")}>
      <div className="flex items-center gap-3">
        <Checkbox checked={selected} onCheckedChange={onToggle} aria-label={`Select ${c.character.name}`} data-testid={`checkbox-char-${c.character.id}`} />
        <CharIcon c={c.character} size={44} />
        <div className="flex-1">
          <div className="flex items-center gap-2 font-semibold">{c.character.name}{c.isSample && <SampleBadge />}</div>
          <div className="text-[11px] text-muted-foreground">{c.character.element} · {c.character.path} · {c.character.rarity}-star</div>
        </div>
        {c.needsReview && <span className="font-data text-[10px] text-accent">REVIEW</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {ROLES.map((r) => {
          const on = roles.includes(r);
          return <motion.button whileTap={{ scale: 0.9 }} key={r} onClick={() => setRoles(on ? roles.filter((x) => x !== r) : [...roles, r])}
            className={cn("rounded-full border px-2.5 py-1 text-xs", on ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground")} data-testid={`chip-role-${c.character.id}-${r}`}>{ROLE_LABEL[r]}</motion.button>;
        })}
        <input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} placeholder="score" className={cn(inputCls, "w-20")} data-testid={`input-score-${c.character.id}`} />
        <label className="flex items-center gap-1.5 text-xs"><Switch checked={rel} onCheckedChange={setRel} data-testid={`switch-released-${c.character.id}`} />Released</label>
        <button onClick={save} disabled={upd.isPending} className="ml-auto inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-60" data-testid={`button-save-char-${c.character.id}`}>
          <Save className="h-3.5 w-3.5" />{upd.isPending ? "Saving" : upd.isSuccess ? "Saved" : "Save"}
        </button>
      </div>
      {upd.isError && <p className="text-xs text-destructive">{errMsg(upd.error)}</p>}
    </Panel>
  );
}

function CoveragePanel({ onPick }: { onPick: (id: string) => void }) {
  const { data, isLoading } = useListDpsCoverage();
  if (isLoading) return <Skeleton className="h-40 rounded-2xl" />;
  if (!data?.length) return <Panel className="text-sm text-muted-foreground">No characters with the DPS role yet. Assign roles in Characters.</Panel>;
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <button key={d.character.id} onClick={() => onPick(d.character.id)} className="flex w-full items-center gap-3 rounded-2xl border border-card-border bg-card/90 p-3 text-left hover:border-primary/60" data-testid={`button-coverage-${d.character.id}`}>
          <CharIcon c={d.character} size={40} />
          <div className="flex-1">
            <div className="text-sm font-semibold">{d.character.name}{!d.isReleased && <span className="ml-2 text-[10px] text-accent">unreleased</span>}</div>
            <div className="mt-1 flex gap-1">{SLOT_ROLES.map((r) => (
              <span key={r} className={cn("font-data rounded px-1.5 py-0.5 text-[9px]", d.poolRoles.includes(r) ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground line-through")}>{ROLE_LABEL[r]}</span>
            ))}</div>
          </div>
          <div className="font-data text-right"><div className={cn("text-lg", d.lineupCount === 0 && "text-accent")}>{d.lineupCount}</div><div className="text-[9px] text-muted-foreground">lineups</div></div>
        </button>
      ))}
    </div>
  );
}

function DpsSelect({ value, onChange }: { value: string | null; onChange: (id: string) => void }) {
  const { data } = useListDpsCoverage();
  return (
    <div className="mb-4">
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={cn(inputCls, "w-full")} data-testid="select-dps">
        <option value="" disabled>Select a DPS to edit</option>
        {(data ?? []).map((d) => <option key={d.character.id} value={d.character.id}>{d.character.name}</option>)}
      </select>
    </div>
  );
}

function useAllChars() {
  const { data } = useListAdminCharacters({ filter: "all" });
  return useMemo(() => new Map((data ?? []).map((c) => [c.character.id, c])), [data]);
}

function CharPicker({ value, onChange, chars, testId }: { value: string; onChange: (id: string) => void; chars: Map<string, AdminCharacter>; testId: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const cur = chars.get(value);
  const list = [...chars.values()].filter((c) => c.character.name.toLowerCase().includes(q.toLowerCase())).slice(0, 40);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(inputCls, "flex min-w-0 flex-1 items-center gap-2 text-left")} data-testid={testId}>
        {cur ? <><CharIcon c={cur.character} size={24} className="rounded-md" /><span className="truncate">{cur.character.name}</span></> : <span className="text-muted-foreground">Pick character</span>}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2">
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className={cn(inputCls, "mb-2 w-full")} />
        <div className="max-h-64 overflow-y-auto">
          {list.map((c) => (
            <button key={c.character.id} onClick={() => { onChange(c.character.id); setOpen(false); }} className="flex w-full items-center gap-2 rounded-lg p-1.5 text-left text-sm hover:bg-secondary">
              <CharIcon c={c.character} size={28} /><span className="flex-1 truncate">{c.character.name}</span>
              <span className="text-[10px] text-muted-foreground">{c.roles.map((r) => ROLE_LABEL[r]).join(" / ")}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const emptySlots = (): LineupSlot[] => SLOT_ROLES.map((role) => ({ role, characterId: "" }));

function LineupsEditor({ dpsId }: { dpsId: string }) {
  const { data, isLoading } = useListAdminLineups({ dpsId });
  const [adding, setAdding] = useState(false);
  if (isLoading) return <Skeleton className="h-40 rounded-2xl" />;
  return (
    <div className="space-y-3">
      {(data ?? []).sort((a, b) => a.rank - b.rank).map((l) => <LineupForm key={l.id} dpsId={dpsId} lineup={l} />)}
      {adding ? <LineupForm dpsId={dpsId} onDone={() => setAdding(false)} /> : (
        <button onClick={() => setAdding(true)} disabled={(data?.length ?? 0) >= 5} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-40" data-testid="button-add-lineup">
          <Plus className="h-4 w-4" />Add lineup
        </button>
      )}
    </div>
  );
}

function LineupForm({ dpsId, lineup, onDone }: { dpsId: string; lineup?: Lineup; onDone?: () => void }) {
  const chars = useAllChars();
  const [title, setTitle] = useState(lineup?.title ?? "");
  const [rank, setRank] = useState(String(lineup?.rank ?? 1));
  const [slots, setSlots] = useState<LineupSlot[]>(lineup?.slots ?? emptySlots());
  const inv = useInvalidateAdmin();
  const create = useCreateLineup();
  const update = useUpdateLineup();
  const del = useDeleteLineup();
  const err = create.error ?? update.error ?? del.error;
  const save = () => {
    const data = { dpsId, rank: Number(rank), title, slots };
    if (lineup) update.mutate({ lineupId: lineup.id, data }, { onSuccess: inv });
    else create.mutate({ data }, { onSuccess: () => { inv(); onDone?.(); } });
  };
  return (
    <Panel className="space-y-2">
      <div className="flex items-center gap-2">
        <input type="number" min={1} max={5} value={rank} onChange={(e) => setRank(e.target.value)} className={cn(inputCls, "w-14")} data-testid="input-lineup-rank" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={cn(inputCls, "flex-1")} data-testid="input-lineup-title" />
        {lineup?.isSample && <SampleBadge />}
      </div>
      {slots.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <select value={s.role} onChange={(e) => setSlots(slots.map((x, j) => j === i ? { ...x, role: e.target.value as SlotRole } : x))} className={cn(inputCls, "w-28")} data-testid={`select-slot-role-${i}`}>
            {SLOT_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
          <CharPicker value={s.characterId} chars={chars} onChange={(id) => setSlots(slots.map((x, j) => j === i ? { ...x, characterId: id } : x))} testId={`picker-slot-${i}`} />
        </div>
      ))}
      {err && <p className="text-xs text-destructive">{errMsg(err)}</p>}
      <div className="flex justify-end gap-2 pt-1">
        {lineup ? (
          <button onClick={() => { if (confirm("Delete this lineup?")) del.mutate({ lineupId: lineup.id }, { onSuccess: inv }); }} className="inline-flex items-center gap-1 rounded-lg border border-destructive/50 px-3 py-1.5 text-xs text-destructive" data-testid={`button-delete-lineup-${lineup.id}`}><Trash2 className="h-3.5 w-3.5" />Delete</button>
        ) : <button onClick={onDone} className="rounded-lg border border-border px-3 py-1.5 text-xs">Cancel</button>}
        <button onClick={save} disabled={create.isPending || update.isPending} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground" data-testid="button-save-lineup"><Save className="h-3.5 w-3.5" />{lineup ? "Save" : "Create"}</button>
      </div>
    </Panel>
  );
}

function SubsEditor({ dpsId }: { dpsId: string }) {
  const { data, isLoading } = useListAdminSubstitutes({ dpsId });
  if (isLoading) return <Skeleton className="h-40 rounded-2xl" />;
  return <div className="space-y-4">{SLOT_ROLES.map((r) => <PoolForm key={`${dpsId}-${r}`} dpsId={dpsId} role={r} pool={(data ?? []).find((p) => p.role === r)} />)}</div>;
}

function PoolForm({ dpsId, role, pool }: { dpsId: string; role: SlotRole; pool?: SubstitutePool }) {
  const chars = useAllChars();
  const [opts, setOpts] = useState<SubstituteOption[]>(pool?.options ?? []);
  useEffect(() => { setOpts(pool?.options ?? []); }, [pool]);
  const upsert = useUpsertSubstitutePool();
  const del = useDeleteSubstitutePool();
  const inv = useInvalidateAdmin();
  const set = (i: number, p: Partial<SubstituteOption>) => setOpts(opts.map((o, j) => j === i ? { ...o, ...p } : o));
  const move = (i: number, d: number) => { const n = [...opts]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); setOpts(n); };
  return (
    <Panel className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="font-display flex-1 text-lg font-bold">{ROLE_LABEL[role]} pool</h3>
        {pool?.isSample && <SampleBadge />}
        {!pool && <span className="text-[11px] text-muted-foreground">not created</span>}
      </div>
      {opts.map((o, i) => (
        <div key={i} className="space-y-1.5 rounded-xl border border-border/70 p-2">
          <div className="flex items-center gap-1.5">
            <CharPicker value={o.characterId} chars={chars} onChange={(id) => set(i, { characterId: id })} testId={`picker-sub-${role}-${i}`} />
            <input type="number" min={0} max={100} value={o.score} onChange={(e) => set(i, { score: Number(e.target.value) })} className={cn(inputCls, "w-16")} data-testid={`input-sub-score-${role}-${i}`} />
            <button disabled={i === 0} onClick={() => move(i, -1)} className="p-1 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
            <button disabled={i === opts.length - 1} onClick={() => move(i, 1)} className="p-1 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
            <button onClick={() => setOpts(opts.filter((_, j) => j !== i))} className="p-1 text-destructive"><X className="h-4 w-4" /></button>
          </div>
          <input value={o.lossNote ?? ""} onChange={(e) => set(i, { lossNote: e.target.value || null })} placeholder="What you lose" className={cn(inputCls, "w-full")} />
          <input value={o.fixNote ?? ""} onChange={(e) => set(i, { fixNote: e.target.value || null })} placeholder="How to compensate" className={cn(inputCls, "w-full")} />
        </div>
      ))}
      <button onClick={() => setOpts([...opts, { characterId: "", score: 70, lossNote: null, fixNote: null }])} className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border py-2 text-xs text-muted-foreground hover:text-primary" data-testid={`button-add-option-${role}`}><Plus className="h-3.5 w-3.5" />Add option</button>
      {(upsert.error || del.error) && <p className="text-xs text-destructive">{errMsg(upsert.error ?? del.error)}</p>}
      <div className="flex justify-end gap-2">
        {pool && <button onClick={() => { if (confirm("Delete this pool?")) del.mutate({ poolId: pool.id }, { onSuccess: inv }); }} className="inline-flex items-center gap-1 rounded-lg border border-destructive/50 px-3 py-1.5 text-xs text-destructive" data-testid={`button-delete-pool-${role}`}><Trash2 className="h-3.5 w-3.5" />Delete pool</button>}
        <button onClick={() => upsert.mutate({ data: { dpsId, role, options: opts } }, { onSuccess: inv })} disabled={upsert.isPending} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground" data-testid={`button-save-pool-${role}`}><Save className="h-3.5 w-3.5" />{upsert.isPending ? "Saving" : "Save pool"}</button>
      </div>
    </Panel>
  );
}
