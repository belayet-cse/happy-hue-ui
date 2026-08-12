import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Trash2, X } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/trtd/AppShell";
import { PageHeader, useGuard } from "@/components/trtd/Guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/trtd/format";
import { createRequest, useTrtdStore } from "@/lib/trtd/store";
import type { LcType, RequestDetails, RequestType } from "@/lib/trtd/types";

export const Route = createFileRoute("/requests/new")({
  head: () => ({
    meta: [
      { title: "New transaction request — Trade Transaction Digitalization" },
      {
        name: "description",
        content:
          "Capture an LC add-confirmation, discounting (UPAS) or combined request in the standard MTB digital format and submit it to MFIS.",
      },
      {
        property: "og:title",
        content: "New transaction request — Trade Transaction Digitalization",
      },
      {
        property: "og:description",
        content:
          "Capture an LC add-confirmation, discounting (UPAS) or combined request in the standard MTB digital format and submit it to MFIS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewRequestPage,
});

/* ---------- BRD transaction types (page 21) ---------- */

type TxnTypeKey = "CONF_SIGHT" | "CONF_DEFERRED" | "CONF_DISC" | "DISC_ONLY";

const TXN_TYPES: Record<
  TxnTypeKey,
  {
    label: string;
    requestType: RequestType;
    lcType: LcType;
    tenorSamples: string[];
    chargeOptions: string[];
  }
> = {
  CONF_SIGHT: {
    label: "1. Add Confirmation Only — At Sight LC",
    requestType: "CONFIRMATION",
    lcType: "AT_SIGHT",
    tenorSamples: [
      "At Sight (from the date of LC issuance to LC expiry)",
      "At Sight (from the date of LC issuance to maturity of the Bill)",
    ],
    chargeOptions: [
      "Confirmation charges on Applicant's account",
      "Confirmation charges on Beneficiary's account",
    ],
  },
  CONF_DEFERRED: {
    label: "2. Add Confirmation Only — Deferred LC",
    requestType: "CONFIRMATION",
    lcType: "DEFERRED",
    tenorSamples: [
      "Deferred — from the date of LC issuance till negotiation / LC expiry",
      "At Sight (from the date of LC issuance to maturity of the Bill)",
    ],
    chargeOptions: [
      "Confirmation charges on Applicant's account",
      "Confirmation charges on Beneficiary's account",
    ],
  },
  CONF_DISC: {
    label: "3. Add Confirmation and Discounting",
    requestType: "ADD_CONF_DISC",
    lcType: "UPAS",
    tenorSamples: [
      "Add Confirmation — from the date of LC issuance till negotiation / LC expiry. Discounting — XXX days from the LC issuance / negotiation / acceptance / Bill of Lading. Beneficiary will receive payment At Sight / XXX days after LC issuance / acceptance / Bill of Lading.",
    ],
    chargeOptions: [
      "Add confirmation charges on Applicant's account; discounting interest on Applicant's account",
      "Add confirmation charges on Applicant's account; discounting interest on Beneficiary's account",
      "Add confirmation charges on Beneficiary's account; discounting interest on Applicant's account",
      "Add confirmation charges on Beneficiary's account; discounting interest on Beneficiary's account",
    ],
  },
  DISC_ONLY: {
    label: "4. Only Discounting",
    requestType: "DISCOUNTING",
    lcType: "UPAS",
    tenorSamples: [
      "Discounting — XXX days from the LC issuance / negotiation / acceptance / Bill of Lading. Beneficiary will receive payment At Sight / XXX days after LC issuance / acceptance / Bill of Lading.",
    ],
    chargeOptions: [
      "Discounting interest on Applicant's account",
      "Discounting interest on Beneficiary's account",
    ],
  },
};

const TOLERANCES = ["Nil", "+/- 5%", "+/- 10%", "+ 5%", "- 5%"];
const COUNTRIES = [
  "China",
  "India",
  "Indonesia",
  "Japan",
  "Korea",
  "Malaysia",
  "Saudi Arabia",
  "Singapore",
  "Thailand",
  "UAE",
  "Vietnam",
];
const DISCHARGE_PORTS = [
  "Chittagong Sea Port, Bangladesh",
  "Mongla Sea Port, Bangladesh",
  "Pangaon ICT, Bangladesh",
  "Benapole Land Port, Bangladesh",
  "Dhaka ICD (Kamalapur), Bangladesh",
];

interface Line {
  amount: string;
  latestShipmentDate: string;
  expiryDate: string;
  expectedPaymentDate: string;
}

const emptyLine = (): Line => ({
  amount: "",
  latestShipmentDate: "",
  expiryDate: "",
  expectedPaymentDate: "",
});

function NewRequestPage() {
  const session = useGuard();
  const navigate = useNavigate();
  const { transactions } = useTrtdStore();

  const [txnTypeKey, setTxnTypeKey] = useState<TxnTypeKey>("CONF_SIGHT");
  const cfg = TXN_TYPES[txnTypeKey];

  const [branch, setBranch] = useState("Principal Branch, Dhaka");
  const [applicantName, setApplicantName] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryAddress, setBeneficiaryAddress] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [tolerance, setTolerance] = useState("Nil");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [tenor, setTenor] = useState(TXN_TYPES.CONF_SIGHT.tenorSamples[0] ?? "");
  const [itemDescription, setItemDescription] = useState("");
  const [origins, setOrigins] = useState<string[]>([]);
  const [shipmentFrom, setShipmentFrom] = useState("");
  const [shipmentTo, setShipmentTo] = useState<string[]>([]);
  const [charges, setCharges] = useState(TXN_TYPES.CONF_SIGHT.chargeOptions[0] ?? "");
  const [lcNumber, setLcNumber] = useState("");
  const [dateOfIssue, setDateOfIssue] = useState("");
  const [documents, setDocuments] = useState<string[]>([]);
  const [docInput, setDocInput] = useState("");
  const [remarks, setRemarks] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const applicantBook = useMemo(() => {
    const map = new Map<string, string>();
    transactions.forEach((t) => {
      if (t.details.applicantName) map.set(t.details.applicantName, t.details.applicantAddress);
    });
    return map;
  }, [transactions]);

  const beneficiaryBook = useMemo(() => {
    const map = new Map<string, string>();
    transactions.forEach((t) => {
      if (t.details.beneficiaryName)
        map.set(t.details.beneficiaryName, t.details.beneficiaryAddress);
    });
    return map;
  }, [transactions]);

  const itemBook = useMemo(
    () =>
      Array.from(
        new Set(
          transactions
            .map((t) => t.details.goodsDescription)
            .filter((x): x is string => Boolean(x)),
        ),
      ),
    [transactions],
  );

  if (!session) return null;

  if (session.role !== "RM") {
    return (
      <AppShell>
        <PageHeader title="New transaction request" />
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Only an RM can raise a new transaction request. You are signed in as{" "}
            {session.role}.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const changeType = (key: TxnTypeKey) => {
    setTxnTypeKey(key);
    setTenor(TXN_TYPES[key].tenorSamples[0] ?? "");
    setCharges(TXN_TYPES[key].chargeOptions[0] ?? "");
  };

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const validate = (): string | null => {
    if (!applicantName.trim()) return "Applicant full name is required";
    if (!beneficiaryName.trim()) return "Beneficiary full name is required";
    if (!itemDescription.trim()) return "Description of item is required";
    if (!lines.length || !Number(lines[0]?.amount)) return "At least one LC value is required";
    for (const [i, l] of lines.entries()) {
      const no = `Transaction ${String(i + 1).padStart(2, "0")}`;
      if (!Number(l.amount)) return `${no}: LC value is required`;
      if (!l.latestShipmentDate) return `${no}: latest date of shipment is required`;
      if (!l.expiryDate) return `${no}: LC expiry date is required`;
      if (l.expiryDate < l.latestShipmentDate)
        return `${no}: LC expiry date cannot be before the latest shipment date`;
      if (l.expectedPaymentDate && l.expectedPaymentDate < l.expiryDate)
        return `${no}: expected payment date cannot be before the LC expiry date`;
    }
    return null;
  };

  const openPreview = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setPreviewOpen(true);
  };

  const submit = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    const ids = lines.map((l) => {
      const details: RequestDetails = {
        lcNumber,
        dateOfIssue,
        currency,
        amount: Number(l.amount),
        tolerance,
        expectedPaymentDate: l.expectedPaymentDate,
        attachments: documents,
        lcType: cfg.lcType,
        tenorOfDraft: tenor,
        confirmationInstruction:
          cfg.requestType === "DISCOUNTING" ? "NOT_REQUIRED" : "REQUIRED",
        applicantName: applicantName.trim(),
        applicantAddress,
        beneficiaryName: beneficiaryName.trim(),
        beneficiaryAddress,
        goodsDescription: itemDescription,
        hsCode: "",
        countryOfOrigin: origins.join(", "),
        portOfLoading: shipmentFrom,
        portOfDischarge: shipmentTo.join(", "),
        latestShipmentDate: l.latestShipmentDate,
        expiryDate: l.expiryDate,
        placeOfExpiry: "",
        advisingBank: "",
        presentationPeriod: "",
        chargesBorneBy: charges,
        beneficiaryPaymentNote: "",
        remarks,
        lcCopyFileName: documents[0] ?? "",
      };
      return createRequest({
        requestType: cfg.requestType,
        branch,
        details,
        actor: session,
      });
    });
    setPreviewOpen(false);
    toast.success(
      ids.length > 1
        ? `${ids.length} transaction requests submitted to MFIS`
        : "Transaction request submitted to MFIS — notification sent",
    );
    const first = ids[0];
    if (first) navigate({ to: "/requests/$id", params: { id: first } });
  };

  return (
    <AppShell>
      <PageHeader
        title="New transaction request"
        description="Standard digital request format (BRD ref. transaction request data to be input by RM)."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Transaction</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>System transaction reference</Label>
              <Input value="Auto generated on submit" readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch / unit</Label>
              <Input id="branch" value={branch} onChange={(e) => setBranch(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Transaction type</Label>
              <Select value={txnTypeKey} onValueChange={(v) => changeType(v as TxnTypeKey)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TXN_TYPES) as TxnTypeKey[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {TXN_TYPES[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Applicant &amp; beneficiary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="app-name">
                Applicant full name<span className="ml-0.5 text-destructive">*</span>
              </Label>
              <Input
                id="app-name"
                list="applicant-book"
                placeholder="Search existing or type a new applicant"
                value={applicantName}
                onChange={(e) => {
                  setApplicantName(e.target.value);
                  const hit = applicantBook.get(e.target.value);
                  if (hit) setApplicantAddress(hit);
                }}
              />
              <datalist id="applicant-book">
                {Array.from(applicantBook.keys()).map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ben-name">
                Beneficiary full name<span className="ml-0.5 text-destructive">*</span>
              </Label>
              <Input
                id="ben-name"
                list="beneficiary-book"
                placeholder="Search existing or type a new beneficiary"
                value={beneficiaryName}
                onChange={(e) => {
                  setBeneficiaryName(e.target.value);
                  const hit = beneficiaryBook.get(e.target.value);
                  if (hit) setBeneficiaryAddress(hit);
                }}
              />
              <datalist id="beneficiary-book">
                {Array.from(beneficiaryBook.keys()).map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-addr">Applicant address</Label>
              <Textarea
                id="app-addr"
                rows={3}
                value={applicantAddress}
                onChange={(e) => setApplicantAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ben-addr">Beneficiary address</Label>
              <Textarea
                id="ben-addr"
                rows={3}
                value={beneficiaryAddress}
                onChange={(e) => setBeneficiaryAddress(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">LC value &amp; schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["USD", "EUR", "GBP", "JPY", "CNY"].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tolerance (+/-)</Label>
                <Select value={tolerance} onValueChange={setTolerance}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOLERANCES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lc-no">LC number (if already issued)</Label>
                <Input
                  id="lc-no"
                  value={lcNumber}
                  onChange={(e) => setLcNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doi">Date of issue</Label>
              <Input
                id="doi"
                type="date"
                className="max-w-xs"
                value={dateOfIssue}
                onChange={(e) => setDateOfIssue(e.target.value)}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Add a line per transaction. Each line gets its own system transaction
                reference. LC expiry cannot be before the latest shipment date, and the
                expected payment date cannot be before LC expiry.
              </p>
              {lines.map((l, i) => (
                <div
                  key={i}
                  className="grid items-end gap-3 rounded-md border border-border p-3 sm:grid-cols-2 lg:grid-cols-5"
                >
                  <div className="space-y-2">
                    <Label htmlFor={`amt-${i}`}>
                      {String(i + 1).padStart(2, "0")}. LC value ({currency})
                      <span className="ml-0.5 text-destructive">*</span>
                    </Label>
                    <Input
                      id={`amt-${i}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.amount}
                      onChange={(e) => setLine(i, { amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`ship-${i}`}>Latest date of shipment</Label>
                    <Input
                      id={`ship-${i}`}
                      type="date"
                      value={l.latestShipmentDate}
                      onChange={(e) => setLine(i, { latestShipmentDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`exp-${i}`}>Expiry date of LC</Label>
                    <Input
                      id={`exp-${i}`}
                      type="date"
                      value={l.expiryDate}
                      onChange={(e) => setLine(i, { expiryDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`pay-${i}`}>Expected payment date</Label>
                    <Input
                      id={`pay-${i}`}
                      type="date"
                      value={l.expectedPaymentDate}
                      onChange={(e) => setLine(i, { expectedPaymentDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={lines.length === 1}
                      onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
              >
                <Plus className="mr-1 h-4 w-4" /> Add another transaction
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tenor of draft</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Sample text</Label>
              <Select value={tenor} onValueChange={setTenor}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a sample tenor" />
                </SelectTrigger>
                <SelectContent>
                  {cfg.tenorSamples.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.length > 90 ? `${s.slice(0, 90)}…` : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenor-text">Tenor of draft (editable)</Label>
              <Textarea
                id="tenor-text"
                rows={4}
                value={tenor}
                onChange={(e) => setTenor(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Goods &amp; shipment</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="item">
                Description of item<span className="ml-0.5 text-destructive">*</span>
              </Label>
              <Input
                id="item"
                list="item-book"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
              />
              <datalist id="item-book">
                {itemBook.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            <MultiSelect
              label="Country of origin"
              options={COUNTRIES}
              values={origins}
              onChange={setOrigins}
              placeholder="Select country / countries"
            />
            <div className="space-y-2">
              <Label htmlFor="ship-from">Shipment from (port with country)</Label>
              <Input
                id="ship-from"
                placeholder="e.g. Port Klang, Malaysia"
                value={shipmentFrom}
                onChange={(e) => setShipmentFrom(e.target.value)}
              />
            </div>
            <MultiSelect
              label="Shipment to"
              options={DISCHARGE_PORTS}
              values={shipmentTo}
              onChange={setShipmentTo}
              placeholder="Select port(s) of discharge"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Charges, documents &amp; remarks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Charges to be borne</Label>
              <Select value={charges} onValueChange={setCharges}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cfg.chargeOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc">Documents attached</Label>
              <div className="flex gap-2">
                <Input
                  id="doc"
                  placeholder="e.g. Pro-forma-invoice.pdf"
                  value={docInput}
                  onChange={(e) => setDocInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (docInput.trim()) {
                        setDocuments((prev) => [...prev, docInput.trim()]);
                        setDocInput("");
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (docInput.trim()) {
                      setDocuments((prev) => [...prev, docInput.trim()]);
                      setDocInput("");
                    }
                  }}
                >
                  Attach
                </Button>
              </div>
              {documents.length ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {documents.map((doc, i) => (
                    <Badge key={`${doc}-${i}`} variant="secondary" className="gap-1">
                      {doc}
                      <button
                        type="button"
                        aria-label={`Remove ${doc}`}
                        onClick={() =>
                          setDocuments((prev) => prev.filter((_, idx) => idx !== i))
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={openPreview}>
            Preview
          </Button>
          <Button type="button" onClick={submit}>
            Submit to MFIS
          </Button>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview before submit</DialogTitle>
          </DialogHeader>
          <dl className="divide-y divide-border text-sm">
            <Row label="Transaction type" value={cfg.label} />
            <Row label="Branch / unit" value={branch} />
            <Row
              label="Applicant"
              value={[applicantName, applicantAddress].filter(Boolean).join(" — ")}
            />
            <Row
              label="Beneficiary"
              value={[beneficiaryName, beneficiaryAddress].filter(Boolean).join(" — ")}
            />
            <Row
              label="LC value & currency"
              value={lines
                .map(
                  (l, i) =>
                    `${String(i + 1).padStart(2, "0")}. ${formatMoney(currency, Number(l.amount) || 0)}`,
                )
                .join(" ; ")}
            />
            <Row label="Tolerance" value={tolerance} />
            <Row label="Tenor of draft" value={tenor} />
            <Row label="Description of item" value={itemDescription} />
            <Row label="Country of origin" value={origins.join(", ")} />
            <Row label="Shipment from" value={shipmentFrom} />
            <Row label="Shipment to" value={shipmentTo.join(", ")} />
            <Row
              label="Latest date of shipment"
              value={lines
                .map((l, i) => `${String(i + 1).padStart(2, "0")}. ${l.latestShipmentDate}`)
                .join(" ; ")}
            />
            <Row
              label="Expiry date of LC"
              value={lines
                .map((l, i) => `${String(i + 1).padStart(2, "0")}. ${l.expiryDate}`)
                .join(" ; ")}
            />
            <Row
              label="Expected payment date"
              value={lines
                .map(
                  (l, i) =>
                    `${String(i + 1).padStart(2, "0")}. ${l.expectedPaymentDate || "—"}`,
                )
                .join(" ; ")}
            />
            <Row label="Charges to be borne" value={charges} />
            <Row label="Documents attached" value={documents.join(", ")} />
            <Row label="Remarks" value={remarks} />
          </dl>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Back to edit
            </Button>
            <Button onClick={submit}>Submit to MFIS</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-3">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="sm:col-span-2">{value || "—"}</dd>
    </div>
  );
}

function MultiSelect({
  label,
  options,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value=""
        onValueChange={(v) => {
          if (!values.includes(v)) onChange([...values, v]);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options
            .filter((o) => !values.includes(o))
            .map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {values.length ? (
        <div className="flex flex-wrap gap-2">
          {values.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1">
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={() => onChange(values.filter((x) => x !== v))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
