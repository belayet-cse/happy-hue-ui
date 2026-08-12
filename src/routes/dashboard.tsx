import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/trtd/AppShell";
import { PageHeader, useGuard } from "@/components/trtd/Guard";
import { StatusBadge } from "@/components/trtd/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatMoney } from "@/lib/trtd/format";
import { useTrtdStore } from "@/lib/trtd/store";
import {
  REQUEST_TYPE_SHORT,
  STATUS_LABEL,
  type Role,
  type Transaction,
  type TxnStatus,
} from "@/lib/trtd/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Trade Transaction Digitalization" },
      {
        name: "description",
        content:
          "Role-based dashboard showing pending LC confirmation and discounting actions across RM, MFIS and MITS.",
      },
      { property: "og:title", content: "Dashboard — Trade Transaction Digitalization" },
      {
        property: "og:description",
        content:
          "Role-based dashboard showing pending LC confirmation and discounting actions across RM, MFIS and MITS.",
      },
    ],
  }),
  component: DashboardPage,
});

export function pendingFor(role: Role, txns: Transaction[]): Transaction[] {
  switch (role) {
    case "RM":
      return txns.filter((t) => t.status === "PRICE_OFFERED" || t.status === "QUERY_RAISED");
    case "MFIS":
      return txns.filter(
        (t) =>
          t.status === "SUBMITTED" ||
          t.status === "FORWARDED" ||
          t.status === "REJECTED_BY_RM",
      );
    case "MITS":
      return txns.filter((t) => t.status === "ACCEPTED" || t.status === "EXECUTED");
  }
}

const PENDING_COPY: Record<Role, string> = {
  RM: "Awaiting your acceptance or query response",
  MFIS: "Awaiting your pricing or reprocessing",
  MITS: "Awaiting execution or completion",
};

function DashboardPage() {
  const session = useGuard();
  const { transactions } = useTrtdStore();
  if (!session) return null;

  const pending = pendingFor(session.role, transactions);
  const statuses: TxnStatus[] = [
    "SUBMITTED",
    "QUERY_RAISED",
    "FORWARDED",
    "PRICE_OFFERED",
    "ACCEPTED",
    "REJECTED_BY_RM",
    "EXECUTED",
    "COMPLETED",
  ];
  const recent = [...transactions]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);
  const totalValue = transactions.reduce((sum, t) => sum + t.details.amount, 0);

  return (
    <AppShell>
      <PageHeader
        title={`Welcome, ${session.name}`}
        description={`${session.role} workspace — ${PENDING_COPY[session.role].toLowerCase()}.`}
        actions={
          session.role === "RM" ? (
            <Button asChild>
              <Link to="/requests/new">New request</Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              My pending actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-primary">{pending.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">{PENDING_COPY[session.role]}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Total transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{transactions.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">All request types</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Aggregate LC value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">
              {formatMoney("USD", totalValue)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Across all statuses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Open queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">
              {transactions.filter((t) => t.queries.some((q) => !q.resolvedAt)).length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Query handler threads open</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">My action queue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link
                        to="/requests/$id"
                        params={{ id: t.id }}
                        className="font-medium text-primary hover:underline"
                      >
                        {t.referenceNo}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {t.details.applicantName || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs">
                      {REQUEST_TYPE_SHORT[t.requestType]}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatMoney(t.details.currency, t.details.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                  </TableRow>
                ))}
                {pending.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      Nothing pending for you right now.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pipeline by status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {statuses.map((s) => {
                const count = transactions.filter((t) => t.status === s).length;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <span className="flex-1 text-xs text-muted-foreground">
                      {STATUS_LABEL[s]}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{count}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recent.map((t) => {
                const last = t.history[t.history.length - 1];
                return (
                  <Link
                    key={t.id}
                    to="/requests/$id"
                    params={{ id: t.id }}
                    className="block rounded-sm border border-border p-2.5 hover:bg-accent/50"
                  >
                    <p className="text-xs font-semibold text-foreground">{t.referenceNo}</p>
                    <p className="text-xs text-muted-foreground">{last?.action}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDateTime(t.updatedAt)}
                    </p>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
