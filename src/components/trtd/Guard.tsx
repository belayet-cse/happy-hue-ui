import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession, useStoreReady } from "@/lib/trtd/store";
import type { Session } from "@/lib/trtd/types";

export function useGuard(): Session | null {
  const session = useSession();
  const ready = useStoreReady();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && !session) navigate({ to: "/login" });
  }, [ready, session, navigate]);
  return session;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}
