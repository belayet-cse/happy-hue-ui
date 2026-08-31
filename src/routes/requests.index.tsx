import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/trtd/AppShell";
import { PageHeader, useGuard } from "@/components/trtd/Guard";
import { StatusBadge } from "@/components/trtd/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/trtd/format";
import { useTrtdStore } from "@/lib/trtd/store";
import {
  LC_TYPE_LABEL,
  REQUEST_TYPE_SHORT,
  STATUS_LABEL,
  type RequestType,
  type TxnStatus,
} from "@/lib/trtd/types";

export const Route = createFileRoute("/requests/")({
  head: () => ({
    meta: [
      { title: "Transactions — Trade Transaction Digitalization" },
      {
        name: "description",
        content:
          "Browse and filter every LC confirmation, discounting and add-confirmation transaction with live workflow status.",
      },
      { property: "og:title", content: "Transactions — Trade Transaction Digitalization" },
      {
        property: "og:description",
        content:
          "Browse and filter every LC confirmation, discounting and add-confirmation transaction with live workflow status.",
      },
    ],
  }),
  component: RequestsListPage,
});

function RequestsListPage() {
  const session = useGuard();
  const { transactions } = useTrtdStore();
  const [q, setQ] = useState("");
  const [type, setType] = useState<RequestType | "ALL">("ALL");
  const [status, setStatus] = useState<TxnStatus | "ALL">("ALL");

  if (!session) return null;

  const rows = transactions
    .filter((t) => (type === "ALL" ? true : t.requestType === type))
    .filter((t) => (status === "ALL" ? true : t.status === status))
    .filter((t) => {
      const needle = q.trim().toLowerCase();
      if (!needle) return true;
      return [
        t.referenceNo,
        t.details.lcNumber,
        t.details.applicantName,
        t.details.beneficiaryName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <AppShell>
      <PageHeader
        title="Transactions"
        description="All confirmation, discounting and combined requests across the workflow."
        actions={
          session.role === "RM" ? (
            <Button asChild>
              <Link to="/requests/new">New request</Link>
            </Button>
          ) : null
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap gap-3 pt-6">
          <Input
            placeholder="Search reference, LC number, applicant, beneficiary…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="min-w-56 flex-1"
          />
          <Select value={type} onValueChange={(v) => setType(v as RequestType | "ALL")}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Request type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All request types</SelectItem>
              <SelectItem value="CONFIRMATION">LC Confirmation</SelectItem>
              <SelectItem value="DISCOUNTING">LC Discounting (UPAS)</SelectItem>
              <SelectItem value="ADD_CONF_DISC">Add Confirmation & Discounting</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v as TxnStatus | "ALL")}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {(Object.keys(STATUS_LABEL) as TxnStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>LC number</TableHead>
                  <TableHead>Applicant / Beneficiary</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Tenor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link
                        to="/requests/$id"
                        params={{ id: t.id }}
                        className="font-medium text-primary hover:underline"
                      >
                        {t.referenceNo}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">
                      {REQUEST_TYPE_SHORT[t.requestType]}
                      <p className="text-muted-foreground">
                        {LC_TYPE_LABEL[t.details.lcType]}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs">{t.details.lcNumber}</TableCell>
                    <TableCell className="max-w-56 text-xs">
                      <p className="truncate font-medium">{t.details.applicantName}</p>
                      <p className="truncate text-muted-foreground">
                        {t.details.beneficiaryName}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatMoney(t.details.currency, t.details.amount)}
                    </TableCell>
                    <TableCell className="text-xs">{t.details.tenorOfDraft}</TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDate(t.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      No transactions match your filters.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
