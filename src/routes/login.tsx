import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signIn, useSession, useStoreReady } from "@/lib/trtd/store";
import type { Role } from "@/lib/trtd/types";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Trade Transaction Digitalization" },
      {
        name: "description",
        content:
          "Portal sign-in for the MTB Trade Transaction Digitalization system for LC confirmation and discounting requests.",
      },
      { property: "og:title", content: "Sign in — Trade Transaction Digitalization" },
      {
        property: "og:description",
        content:
          "Portal sign-in for the MTB Trade Transaction Digitalization system for LC confirmation and discounting requests.",
      },
    ],
  }),
  component: LoginPage,
});

const DEMO_USERS: Record<Role, { name: string; user: string; desc: string }> = {
  RM: {
    name: "Rakib Hasan",
    user: "rakib.hasan",
    desc: "Raises confirmation and discounting requests, accepts or rejects pricing.",
  },
  MFIS: {
    name: "Tanvir Ahmed",
    user: "tanvir.ahmed",
    desc: "Queries the RM, forwards to third bank / OBU, quotes pricing.",
  },
  MITS: {
    name: "Sabbir Rahman",
    user: "sabbir.rahman",
    desc: "Executes accepted transactions and closes them.",
  },
};

function LoginPage() {
  const navigate = useNavigate();
  const session = useSession();
  const ready = useStoreReady();
  const [role, setRole] = useState<Role>("RM");
  const [username, setUsername] = useState(DEMO_USERS.RM.user);
  const [password, setPassword] = useState("portal");

  useEffect(() => {
    if (ready && session) navigate({ to: "/dashboard" });
  }, [ready, session, navigate]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Enter your portal username and password");
      return;
    }
    signIn({ name: DEMO_USERS[role].name, role });
    toast.success(`Signed in as ${DEMO_USERS[role].name} (${role})`);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="font-semibold">TRTD</p>
            <p className="text-xs text-sidebar-foreground/70">
              Trade Transaction Digitalization
            </p>
          </div>
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl leading-tight font-semibold">
            From mailbox threads to a tracked transaction.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-sidebar-foreground/80">
            LC confirmation, discounting (UPAS) and combined add-confirmation requests move
            from RM to MFIS to MITS in one place — with pricing, queries, history and
            notifications recorded against every single transaction.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-sidebar-foreground/75">
            <li>· Structured request forms replacing tabular emails</li>
            <li>· Price matrix quoted, revised, accepted or rejected in-system</li>
            <li>· Full history tracker and per-transaction query handler</li>
          </ul>
        </div>
        <p className="text-xs text-sidebar-foreground/50">
          Internal use only · Mutual Trust Bank PLC
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground">Portal sign in</h1>
            <p className="text-sm text-muted-foreground">
              Authenticate with your internal portal credentials.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                const next = v as Role;
                setRole(next);
                setUsername(DEMO_USERS[next].user);
              }}
            >
              <SelectTrigger id="role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RM">RM — Relationship / Branch Management</SelectItem>
                <SelectItem value="MFIS">MFIS — Financial Institutions</SelectItem>
                <SelectItem value="MITS">MITS — International Trade Services</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{DEMO_USERS[role].desc}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full">
            Sign in
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Prototype sign-in — no live directory lookup. Any password works.
          </p>
        </form>
      </div>
    </div>
  );
}
