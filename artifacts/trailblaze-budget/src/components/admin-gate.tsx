import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Lock, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAdminSession, getGetAdminSessionQueryKey, useAdminLogin, useAdminLogout,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { errMsg } from "@/lib/tb";

const isUnauthorized = (e: unknown) => (e as { status?: number } | null)?.status === 401;

/**
 * Shows a password prompt until the caller holds an admin session. If any admin
 * request later comes back 401 (session expired or password rotated), the
 * session is re-checked so the prompt reappears instead of broken panels.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const session = useGetAdminSession();

  useEffect(() => {
    const recheck = () => qc.invalidateQueries({ queryKey: getGetAdminSessionQueryKey() });
    const unsubQ = qc.getQueryCache().subscribe((ev) => {
      if (ev.type === "updated" && ev.action.type === "error" && isUnauthorized(ev.action.error)) recheck();
    });
    const unsubM = qc.getMutationCache().subscribe((ev) => {
      if (ev.type === "updated" && ev.action.type === "error" && isUnauthorized(ev.action.error)) recheck();
    });
    return () => { unsubQ(); unsubM(); };
  }, [qc]);

  if (session.isLoading) return <Skeleton className="h-48 rounded-2xl" />;
  if (session.isError || !session.data) {
    return (
      <Card>
        Couldn't check admin access.{" "}
        <button className="text-primary underline" onClick={() => session.refetch()}>Retry</button>
      </Card>
    );
  }
  if (!session.data.configured) {
    return (
      <Card>
        <Title />
        <p className="text-sm text-muted-foreground">
          Admin is locked. Set the <code className="font-data text-foreground">ADMIN_PASSWORD</code> secret to enable the console.
        </p>
      </Card>
    );
  }
  if (!session.data.authenticated) return <LoginForm />;
  return (
    <>
      <LogoutButton />
      {children}
    </>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-sm rounded-2xl border border-card-border bg-card/90 p-5">{children}</div>;
}

function Title() {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary"><Lock className="h-4 w-4" /></span>
      <div>
        <p className="font-data text-[10px] uppercase tracking-[0.25em] text-accent">Conductor's console</p>
        <h1 className="font-display text-lg font-extrabold tracking-tight">Staff only</h1>
      </div>
    </div>
  );
}

function LoginForm() {
  const qc = useQueryClient();
  const [password, setPassword] = useState("");
  const login = useAdminLogin({
    mutation: {
      onSuccess: (data) => {
        setPassword("");
        qc.setQueryData(getGetAdminSessionQueryKey(), data);
        qc.invalidateQueries();
      },
    },
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (password) login.mutate({ data: { password } });
  };
  return (
    <Card>
      <Title />
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Admin password</span>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-input bg-background/60 px-2.5 py-2 text-sm outline-none focus:border-primary"
            data-testid="input-admin-password"
          />
        </label>
        {login.isError && <p className="text-sm text-destructive" data-testid="text-login-error">{errMsg(login.error)}</p>}
        <button
          type="submit"
          disabled={!password || login.isPending}
          className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          data-testid="button-admin-login"
        >
          {login.isPending ? "Checking…" : "Unlock"}
        </button>
      </form>
    </Card>
  );
}

function LogoutButton() {
  const qc = useQueryClient();
  const logout = useAdminLogout({
    mutation: {
      onSuccess: (data) => {
        qc.setQueryData(getGetAdminSessionQueryKey(), data);
        const sessionKey = getGetAdminSessionQueryKey()[0];
        qc.removeQueries({
          predicate: (q) => {
            const k = String(q.queryKey[0] ?? "");
            return k !== sessionKey && k.includes("/api/admin/");
          },
        });
      },
    },
  });
  return (
    <div className="mb-2 flex justify-end">
      <button
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        className="font-data flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        data-testid="button-admin-logout"
      >
        <LogOut className="h-3.5 w-3.5" /> Lock
      </button>
    </div>
  );
}
