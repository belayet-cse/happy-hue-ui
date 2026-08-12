import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/trtd/AppShell";
import { useGuard } from "@/components/trtd/Guard";
import { FieldRow, FieldTable } from "@/components/trtd/FieldTable";
import { PriceQuoteForm } from "@/components/trtd/PriceQuoteForm";
import { StatusBadge } from "@/components/trtd/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatDateTime, formatMoney } from "@/lib/trtd/format";
import {
  acceptPrice,
  completeTransaction,
  executeTransaction,
  forwardRequest,
  latestQuote,
  openQuery,
  raiseQuery,
  recordForwardResponse,
  rejectPrice,
  replyQuery,
  resolveQuery,
  useTrtdStore,
} from "@/lib/trtd/store";
import {
  LC_TYPE_LABEL,
  REQUEST_TYPE_LABEL,
  type PriceQuote,
  type Transaction,
} from "@/lib/trtd/types";

export const Route = createFileRoute("/requests/$id")({
  head: () => ({
    meta: [
      { title: "Transaction detail — Trade Transaction Digitalization" },
      {
        name: "description",
        content:
          "Full transaction record: LC particulars, pricing, query handler, forwarding trail, execution and history tracker.",
      },
      {
        property: "og:title",
        content: "Transaction detail — Trade Transaction Digitalization",
      },
      {
        property: "og:description",
        content:
          "Full transaction record: LC particulars, pricing, query handler, forwarding trail, execution and history tracker.",
      },
    ],
  }),
  component: RequestDetailPage,
});

function RequestDetailPage() {
  const session = useGuard();
  const { id } = useParams({ from: "/requests/$id" });
  const { transactions } = useTrtdStore();
  const txn = transactions.find((t) => t.id === id);

  if (!session) return null;

  if (!txn) {
    return (
      <AppShell>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Transaction not found.
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link to="/requests">Back to transactions</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const quote = latestQuote(txn);
  const d = txn.details;

  return (
    <AppShell>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/requests">
            <ArrowLeft className="size-4" /> Back to transactions
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">{txn.referenceNo}</h1>
            <StatusBadge status={txn.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {REQUEST_TYPE_LABEL[txn.requestType]} · {LC_TYPE_LABEL[d.lcType]} ·{" "}
            {formatMoney(d.currency, d.amount)}
          </p>
          <p className="text-xs text-muted-foreground">
            Raised by {txn.raisedByName} · {txn.branch} · {formatDateTime(txn.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Request</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="queries">
                Queries{txn.queries.length ? ` (${txn.queries.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="forwards">
                Forwarding{txn.forwards.length ? ` (${txn.forwards.length})` : ""}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <FieldTable title="LC particulars">
                <FieldRow label="LC number" value={d.lcNumber} />
                <FieldRow label="Date of issue" value={formatDate(d.dateOfIssue)} />
                <FieldRow label="LC value" value={formatMoney(d.currency, d.amount)} />
                <FieldRow label="LC type" value={LC_TYPE_LABEL[d.lcType]} />
                <FieldRow label="Tenor of draft" value={d.tenorOfDraft} />
                <FieldRow
                  label="Confirmation instruction"
                  value={
                    d.confirmationInstruction === "REQUIRED"
                      ? "Confirmation required"
                      : "Confirmation not required"
                  }
                />
                <FieldRow label="Advising / nominated bank" value={d.advisingBank} />
                <FieldRow label="LC copy" value={d.lcCopyFileName} />
              </FieldTable>

              <FieldTable title="Parties">
                <FieldRow label="Applicant" value={d.applicantName} />
                <FieldRow label="Applicant address" value={d.applicantAddress} />
                <FieldRow label="Beneficiary" value={d.beneficiaryName} />
                <FieldRow label="Beneficiary address" value={d.beneficiaryAddress} />
              </FieldTable>

              <FieldTable title="Goods & shipment">
                <FieldRow label="Description of goods" value={d.goodsDescription} />
                <FieldRow label="HS code" value={d.hsCode} />
                <FieldRow label="Country of origin" value={d.countryOfOrigin} />
                <FieldRow label="Port of loading" value={d.portOfLoading} />
                <FieldRow label="Port of discharge" value={d.portOfDischarge} />
                <FieldRow label="Latest shipment date" value={formatDate(d.latestShipmentDate)} />
                <FieldRow
                  label="Expiry"
                  value={`${formatDate(d.expiryDate)}${d.placeOfExpiry ? ` at ${d.placeOfExpiry}` : ""}`}
                />
                <FieldRow label="Presentation period" value={d.presentationPeriod} />
                <FieldRow label="Charges borne by" value={d.chargesBorneBy} />
              </FieldTable>

              <FieldTable title="Notes">
                <FieldRow label="Beneficiary payment note" value={d.beneficiaryPaymentNote} />
                <FieldRow label="Remarks" value={d.remarks} />
                {txn.rejectionReason ? (
                  <FieldRow label="Last rejection reason" value={txn.rejectionReason} />
                ) : null}
              </FieldTable>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              {txn.quotes.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    No pricing offered yet.
                  </CardContent>
                </Card>
              ) : (
                [...txn.quotes]
                  .reverse()
                  .map((q) => (
                    <QuoteCard
                      key={q.revision}
                      q={q}
                      role={session.role}
                      accepted={txn.acceptedQuoteRevision === q.revision}
                    />
                  ))
              )}
            </TabsContent>

            <TabsContent value="queries" className="space-y-4">
              {txn.queries.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    No queries raised on this transaction.
                  </CardContent>
                </Card>
              ) : (
                txn.queries.map((thread) => (
                  <Card key={thread.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        {thread.subject}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {thread.resolvedAt
                            ? `Resolved ${formatDateTime(thread.resolvedAt)}`
                            : "Open"}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {thread.messages.map((m) => (
                        <div key={m.id} className="rounded-sm border border-border bg-surface p-3">
                          <p className="text-xs font-semibold text-foreground">
                            {m.byName.replace(/\s*\((?:RM|MFIS|MITS)\)\s*$/, "")} ({m.byRole})
                            <span className="ml-2 font-normal text-muted-foreground">
                              {formatDateTime(m.at)}
                            </span>
                          </p>
                          <p className="mt-1 text-sm whitespace-pre-line text-foreground">
                            {m.message}
                          </p>
                        </div>
                      ))}
                      {!thread.resolvedAt ? (
                        <QueryReply
                          onReply={(msg) => {
                            replyQuery(txn.id, thread.id, session, msg);
                            toast.success("Response added");
                          }}
                          onResolve={
                            session.role === "MFIS"
                              ? () => {
                                  resolveQuery(txn.id, thread.id, session);
                                  toast.success("Query marked resolved");
                                }
                              : undefined
                          }
                        />
                      ) : null}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="forwards" className="space-y-4">
              {txn.forwards.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    Not forwarded to any third bank or OBU.
                  </CardContent>
                </Card>
              ) : (
                txn.forwards.map((f, i) => (
                  <Card key={`${f.forwardedTo}-${i}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        {f.forwardedTo}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {f.channel === "OBU" ? "OBU" : "Third bank"} ·{" "}
                          {formatDateTime(f.forwardedAt)}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {f.note ? <p className="text-muted-foreground">{f.note}</p> : null}
                      {f.responseAt ? (
                        <div className="rounded-sm border border-border bg-surface p-3">
                          <p className="text-xs font-semibold text-foreground">
                            Response received {formatDateTime(f.responseAt)}
                          </p>
                          <p className="mt-1 whitespace-pre-line">{f.responseSummary}</p>
                          {f.indicativePricing ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Indicative pricing: {f.indicativePricing}
                            </p>
                          ) : null}
                        </div>
                      ) : session.role === "MFIS" ? (
                        <ForwardResponseForm
                          onSubmit={(summary, pricing) => {
                            recordForwardResponse(txn.id, session, i, summary, pricing);
                            toast.success("Response recorded");
                          }}
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground">Awaiting response.</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <ActionPanel txn={txn} role={session.role} session={session} quote={quote} />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">History tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l border-border pl-5">
                {[...txn.history].reverse().map((h) => (
                  <li key={h.id} className="relative">
                    <span className="absolute top-1.5 -left-[1.4rem] size-2 rounded-full bg-primary" />
                    <p className="text-sm font-medium text-foreground">{h.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.actorName.replace(/\s*\((?:RM|MFIS|MITS)\)\s*$/, "")} (
                      {h.actorRole}) · {formatDateTime(h.at)}
                    </p>
                    {h.remarks ? (
                      <p className="mt-1 rounded-sm bg-surface px-2 py-1 text-xs whitespace-pre-line text-muted-foreground">
                        {h.remarks}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {txn.execution ? (
            <FieldTable title="Execution">
              <FieldRow label="Executed by" value={txn.execution.executedBy} />
              <FieldRow label="Executed at" value={formatDateTime(txn.execution.executedAt)} />
              <FieldRow label="System reference" value={txn.execution.referenceNo} />
              <FieldRow label="Remarks" value={txn.execution.remarks} />
              <FieldRow
                label="Completed at"
                value={txn.execution.completedAt ? formatDateTime(txn.execution.completedAt) : "—"}
              />
            </FieldTable>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

function QuoteCard({
  q,
  role,
  accepted,
}: {
  q: PriceQuote;
  role: "RM" | "MFIS" | "MITS";
  accepted?: boolean;
}) {
  const title = [
    q.optionNo ? `Option ${String(q.optionNo).padStart(2, "0")}` : null,
    q.bankName || "Price quote",
    `revision ${q.revision}`,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <FieldTable title={accepted ? `${title} — accepted by RM` : title}>
      <FieldRow label="Bank name" value={q.bankName || "—"} />
      <FieldRow label="Pricing" value={q.pricingSummary || "—"} />
      <FieldRow label="Quoted by" value={`${q.quotedBy} · ${formatDateTime(q.quotedAt)}`} />
      <FieldRow label="Additional condition" value={q.additionalConditions || "—"} />
      {role === "MFIS" ? (
        <FieldRow
          label="Attachment (MFIS only)"
          value={(q.thirdBankMailFiles ?? []).join(", ") || "—"}
        />
      ) : null}
    </FieldTable>
  );
}

function QueryReply({
  onReply,
  onResolve,
}: {
  onReply: (msg: string) => void;
  onResolve?: (() => void) | undefined;
}) {
  const [msg, setMsg] = useState("");
  return (
    <div className="space-y-2">
      <Textarea
        rows={3}
        placeholder="Add your response…"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        {onResolve ? (
          <Button variant="outline" size="sm" onClick={onResolve}>
            Mark resolved
          </Button>
        ) : null}
        <Button
          size="sm"
          onClick={() => {
            if (!msg.trim()) { toast.error("Enter a response"); return; }
            onReply(msg.trim());
            setMsg("");
          }}
        >
          Send response
        </Button>
      </div>
    </div>
  );
}

function ForwardResponseForm({
  onSubmit,
}: {
  onSubmit: (summary: string, pricing: string) => void;
}) {
  const [summary, setSummary] = useState("");
  const [pricing, setPricing] = useState("");
  return (
    <div className="space-y-2">
      <Textarea
        rows={2}
        placeholder="Response summary from third bank / OBU"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
      />
      <Input
        placeholder="Indicative pricing (e.g. SOFR + 2.10% p.a.)"
        value={pricing}
        onChange={(e) => setPricing(e.target.value)}
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            if (!summary.trim()) { toast.error("Enter the response summary"); return; }
            onSubmit(summary.trim(), pricing.trim());
            setSummary("");
            setPricing("");
          }}
        >
          Record response
        </Button>
      </div>
    </div>
  );
}

function ActionPanel({
  txn,
  role,
  session,
  quote,
}: {
  txn: Transaction;
  role: "RM" | "MFIS" | "MITS";
  session: { name: string; role: "RM" | "MFIS" | "MITS" };
  quote: PriceQuote | undefined;
}) {
  const [remarks, setRemarks] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const pending = openQuery(txn);
  const latestBatch = quote
    ? txn.quotes.filter((q) => q.quotedAt === quote.quotedAt)
    : [];


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Actions · {role}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="flex items-start gap-2 rounded-sm bg-surface p-2.5 text-xs text-muted-foreground">
          <Mail className="mt-0.5 size-3.5 shrink-0" />
          Every action below raises an in-app notification and an email to the next desk.
        </p>

        {role === "MFIS" ? (
          <MfisActions txn={txn} session={session} />
        ) : role === "RM" ? (
          <>
            {txn.status === "PRICE_OFFERED" && quote ? (
              <div className="space-y-2">
                {latestBatch.length > 1 ? (
                  <div className="space-y-2">
                    <Label>Select the bank pricing to accept</Label>
                    <Select
                      value={String(selected ?? quote.revision)}
                      onValueChange={(v) => setSelected(Number(v))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {latestBatch.map((q) => (
                          <SelectItem key={q.revision} value={String(q.revision)}>
                            {`Option ${String(q.optionNo ?? 1).padStart(2, "0")} · ${q.bankName || "Bank"} · ${q.pricingSummary || q.financingMargin}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                <Label>Remarks</Label>
                <Textarea
                  rows={3}
                  placeholder="Optional remarks for MFIS"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      acceptPrice(
                        txn.id,
                        session,
                        remarks || "Pricing acceptable to client.",
                        selected ?? quote.revision,
                      );
                      setRemarks("");
                      toast.success("Price accepted — MITS notified");
                    }}
                  >
                    Accept price
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (!remarks.trim())
                        { toast.error("Rejection reason is required"); return; }
                      rejectPrice(txn.id, session, remarks.trim());
                      setRemarks("");
                      toast.success("Price rejected — returned to MFIS");
                    }}
                  >
                    Reject price
                  </Button>
                </div>
              </div>
            ) : pending ? (
              <p className="text-sm text-muted-foreground">
                MFIS raised a query — respond in the Queries tab.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No action required from you at this stage.
              </p>
            )}
          </>
        ) : (
          <>
            {txn.status === "ACCEPTED" ? (
              <MitsExecuteForm txn={txn} session={session} />
            ) : txn.status === "EXECUTED" ? (
              <div className="space-y-2">
                <Label>Completion remarks</Label>
                <Textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Acceptance advice received; transaction closed."
                />
                <Button
                  onClick={() => {
                    completeTransaction(txn.id, session, remarks || "Transaction closed.");
                    setRemarks("");
                    toast.success("Transaction completed");
                  }}
                >
                  Mark completed
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {txn.status === "COMPLETED"
                  ? "This transaction is complete. No further action required."
                  : "This transaction is not yet with MITS."}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MitsExecuteForm({
  txn,
  session,
}: {
  txn: Transaction;
  session: { name: string; role: "RM" | "MFIS" | "MITS" };
}) {
  const [ref, setRef] = useState("");
  const [remarks, setRemarks] = useState("");
  return (
    <div className="space-y-2">
      <Label htmlFor="exec-ref">Core banking / SWIFT reference</Label>
      <Input id="exec-ref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. MT700-2026-0142" />
      <Label htmlFor="exec-remarks">Execution remarks</Label>
      <Textarea id="exec-remarks" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      <Button
        onClick={() => {
          if (!ref.trim()) { toast.error("Enter the execution reference"); return; }
          executeTransaction(txn.id, session, ref.trim(), remarks);
          setRef("");
          setRemarks("");
          toast.success("Transaction executed — RM and MFIS notified");
        }}
      >
        Mark executed
      </Button>
    </div>
  );
}

function MfisActions({
  txn,
  session,
}: {
  txn: Transaction;
  session: { name: string; role: "RM" | "MFIS" | "MITS" };
}) {
  const [mode, setMode] = useState<"PRICE" | "QUERY" | "FORWARD">("PRICE");
  const [q, setQ] = useState({ subject: "", message: "" });
  const [fwd, setFwd] = useState<{
    forwardedTo: string;
    channel: "THIRD_BANK" | "OBU";
    note: string;
  }>({ forwardedTo: "", channel: "THIRD_BANK", note: "" });

  const done = txn.status === "ACCEPTED" || txn.status === "EXECUTED" || txn.status === "COMPLETED";
  if (done) {
    return (
      <p className="text-sm text-muted-foreground">
        Pricing accepted — the transaction is with MITS. No MFIS action pending.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Action</Label>
        <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PRICE">Offer / revise price</SelectItem>
            <SelectItem value="QUERY">Raise query to RM</SelectItem>
            <SelectItem value="FORWARD">Forward to third bank / OBU</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === "QUERY" ? (
        <div className="space-y-2">
          <Input
            placeholder="Query subject"
            value={q.subject}
            onChange={(e) => setQ({ ...q, subject: e.target.value })}
          />
          <Textarea
            rows={4}
            placeholder="Details of the clarification needed from the RM"
            value={q.message}
            onChange={(e) => setQ({ ...q, message: e.target.value })}
          />
          <Button
            className="w-full"
            onClick={() => {
              if (!q.subject.trim() || !q.message.trim())
                { toast.error("Subject and message are required"); return; }
              raiseQuery(txn.id, session, q.subject.trim(), q.message.trim());
              setQ({ subject: "", message: "" });
              toast.success("Query raised — RM notified");
            }}
          >
            Raise query
          </Button>
        </div>
      ) : null}

      {mode === "FORWARD" ? (
        <div className="space-y-2">
          <Select
            value={fwd.channel}
            onValueChange={(v) => setFwd({ ...fwd, channel: v as "THIRD_BANK" | "OBU" })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="THIRD_BANK">Third bank</SelectItem>
              <SelectItem value="OBU">MTB OBU</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Institution name (e.g. Standard Chartered Bank, Singapore)"
            value={fwd.forwardedTo}
            onChange={(e) => setFwd({ ...fwd, forwardedTo: e.target.value })}
          />
          <Textarea
            rows={3}
            placeholder="Note to the counterparty"
            value={fwd.note}
            onChange={(e) => setFwd({ ...fwd, note: e.target.value })}
          />
          <Button
            className="w-full"
            onClick={() => {
              if (!fwd.forwardedTo.trim()) { toast.error("Institution name is required"); return; }
              forwardRequest(txn.id, session, {
                forwardedTo: fwd.forwardedTo.trim(),
                channel: fwd.channel,
                note: fwd.note,
              });
              setFwd({ forwardedTo: "", channel: "THIRD_BANK", note: "" });
              toast.success("Forwarded — RM notified");
            }}
          >
            Forward request
          </Button>
        </div>
      ) : null}

      {mode === "PRICE" ? <PriceQuoteForm txn={txn} session={session} />: null}
    </div>
  );
}
