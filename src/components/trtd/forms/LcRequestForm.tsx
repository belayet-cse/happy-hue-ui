import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ADVISING_BANKS,
  COUNTRIES,
  CURRENCIES,
  DISCHARGE_PORTS,
  DocumentsField,
  LOADING_PORTS,
  MultiSelect,
  PreviewRow,
  Section,
  TOLERANCES,
} from "@/components/trtd/FormKit";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { blankDetails, type LcType, type RequestType, type Session } from "@/lib/trtd/types";

/* ---------- BRD field 01: transaction type ---------- */

export type TxnTypeKey = "CONF_SIGHT" | "CONF_DEFERRED" | "CONF_DISC" | "POST_ACC_DISC";

const TXN_TYPES: Record<
  TxnTypeKey,
  { label: string; requestType: RequestType; lcType: LcType; tenorSamples: string[] }
> = {
  CONF_SIGHT: {
    label: "1. Add Confirmation Only — At Sight LC",
    requestType: "CONFIRMATION",
    lcType: "AT_SIGHT",
    tenorSamples: [
      "At Sight (from the date of LC issuance to LC expiry)",
      "At Sight (from the date of LC issuance to maturity of the Bill)",
      "Other — please specify",
    ],
  },
  CONF_DEFERRED: {
    label: "2. Add Confirmation Only — Deferred LC",
    requestType: "CONFIRMATION",
    lcType: "DEFERRED",
    tenorSamples: [
      "Add Confirmation — from the date of LC issuance till negotiation / LC expiry",
      "At Sight (from the date of LC issuance to maturity of the Bill)",
      "Other — please specify",
    ],
  },
  CONF_DISC: {
    label: "3. Add Confirmation and Discounting",
    requestType: "ADD_CONF_DISC",
    lcType: "UPAS",
    tenorSamples: [
      "Add Confirmation — from the date of LC issuance till negotiation / LC expiry, and Discounting — XXX days from the LC issuance / negotiation / acceptance / Bill of Lading. Beneficiary will receive payment At Sight / XXX days after LC issuance / acceptance / Bill of Lading.",
      "Other — please specify",
    ],
  },
  POST_ACC_DISC: {
    label: "4. Post Acceptance Discounting [without Confirmation]",
    requestType: "DISCOUNTING",
    lcType: "UPAS",
    tenorSamples: [
      "Discounting — XXX days from the LC issuance / negotiation / acceptance / Bill of Lading. Beneficiary will receive payment At Sight / XXX days after LC issuance / acceptance / Bill of Lading.",
      "Other — please specify",
    ],
  },
};

const CHARGE_CATEGORIES = ["Confirmation charges", "Discounting charges"];
const ACCOUNT_OF = ["Applicant", "Beneficiary", "Mixed"];

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

export function LcRequestForm({ session }: { session: Session }) {
  const navigate = useNavigate();
  const { transactions } = useTrtdStore();

  const [txnTypeKey, setTxnTypeKey] = useState<TxnTypeKey>("CONF_SIGHT");
  const cfg = TXN_TYPES[txnTypeKey];

  const [branch, setBranch] = useState("Principal Branch, Dhaka");
  const [applicantCif, setApplicantCif] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryAddress, setBeneficiaryAddress] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [tolerance, setTolerance] = useState("Nil");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [tenor, setTenor] = useState(TXN_TYPES.CONF_SIGHT.tenorSamples[0] ?? "");
  const [goods, setGoods] = useState("");
  const [origins, setOrigins] = useState<string[]>([]);
  const [placeOfExpiry, setPlaceOfExpiry] = useState("");
  const [loadingPorts, setLoadingPorts] = useState<string[]>([]);
  const [dischargePorts, setDischargePorts] = useState<string[]>([]);
  const [adviseThroughBank, setAdviseThroughBank] = useState("");
  const [chargeCategories, setChargeCategories] = useState<string[]>([
    "Confirmation charges",
  ]);
  const [accountOf, setAccountOf] = useState("Applicant");
  const [mixedNote, setMixedNote] = useState("");
  const [lcNumber, setLcNumber] = useState("");
  const [dateOfIssue, setDateOfIssue] = useState("");
  const [documents, setDocuments] = useState<string[]>([]);
  const [remarks, setRemarks] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const applicantBook = useMemo(() => {
    const map = new Map<string, string>();
    transactions.forEach((t) => {
      if (t.details.applicantName)
        map.set(t.details.applicantName, t.details.applicantAddress);
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

  const goodsBook = useMemo(
    () =>
      Array.from(
        new Set(transactions.map((t) => t.details.goodsDescription).filter(Boolean)),
      ),
    [transactions],
  );

  const changeType = (key: TxnTypeKey) => {
    setTxnTypeKey(key);
    setTenor(TXN_TYPES[key].tenorSamples[0] ?? "");
    setChargeCategories(
      key === "POST_ACC_DISC"
        ? ["Discounting charges"]
        : key === "CONF_DISC"
          ? ["Confirmation charges", "Discounting charges"]
          : ["Confirmation charges"],
    );
  };

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const total = lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  const chargesLabel = [
    chargeCategories.join(" + ") || "—",
    `on ${accountOf === "Mixed" ? `mixed account (${mixedNote || "please specify"})` : `${accountOf}'s account`}`,
  ].join(" ");

  const validate = (): string | null => {
    if (!applicantName.trim()) return "Applicant full name is required";
    if (!beneficiaryName.trim()) return "Beneficiary full name is required";
    if (!goods.trim()) return "Goods description is required";
    if (!chargeCategories.length) return "Select at least one charge category";
    if (accountOf === "Mixed" && !mixedNote.trim())
      return "Please specify the mixed charge arrangement";
    if (!lines.length || !Number(lines[0]?.amount)) return "At least one LC value is required";
    for (const [i, l] of lines.entries()) {
      const no = `Transaction ${String(i + 1).padStart(2, "0")}`;
      if (!Number(l.amount)) return `${no}: LC value is required`;
      if (!l.latestShipmentDate) return `${no}: latest date of shipment is required`;
      if (!l.expiryDate) return `${no}: date of expiry is required`;
      if (l.expiryDate < l.latestShipmentDate)
        return `${no}: date of expiry cannot be before the latest shipment date`;
      if (l.expectedPaymentDate && l.expectedPaymentDate < l.expiryDate)
        return `${no}: expected payment date cannot be before the LC expiry date`;
    }
    return null;
  };

  const openPreview = () => {
    const err = validate();
    if (err) return void toast.error(err);
    setPreviewOpen(true);
  };

  const submit = () => {
    const err = validate();
    if (err) return void toast.error(err);

    const ids = lines.map((l) =>
      createRequest({
        requestType: cfg.requestType,
        module: "IMPORT",
        subDivision: "1.1 MTB Transaction Request",
        branch,
        actor: session,
        details: {
          ...blankDetails(),
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
          goodsDescription: goods,
          countryOfOrigin: origins.join(", "),
          portOfLoading: loadingPorts.join(", "),
          portOfDischarge: dischargePorts.join(", "),
          latestShipmentDate: l.latestShipmentDate,
          expiryDate: l.expiryDate,
          placeOfExpiry,
          adviseThroughBank,
          chargeCategories,
          chargesOnAccountOf: accountOf === "Mixed" ? `Mixed — ${mixedNote}` : accountOf,
          chargesBorneBy: chargesLabel,
          remarks,
          lcCopyFileName: documents[0] ?? "",
        },
      }),
    );

    setPreviewOpen(false);
    toast.success(
      ids.length > 1
        ? `${ids.length} transaction requests submitted to FI (MFIS)`
        : "Transaction request submitted to FI (MFIS) — notification sent",
    );
    const first = ids[0];
    if (first) navigate({ to: "/requests/$id", params: { id: first } });
  };

  return (
    <div className="space-y-6">
      <Section title="Transaction">
        <div className="space-y-2">
          <Label>System transaction reference number</Label>
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
      </Section>

      <Section title="Applicant & beneficiary">
        <div className="space-y-2">
          <Label htmlFor="cif">Applicant CIF (auto search)</Label>
          <Input
            id="cif"
            placeholder="e.g. 0012345678"
            value={applicantCif}
            onChange={(e) => setApplicantCif(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="app-name">
            Applicant full name<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="app-name"
            list="applicant-book"
            placeholder="Search existing or add a new applicant"
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
          <Label htmlFor="app-addr">Applicant address</Label>
          <Textarea
            id="app-addr"
            rows={3}
            value={applicantAddress}
            onChange={(e) => setApplicantAddress(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ben-name">
            Beneficiary full name<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="ben-name"
            list="beneficiary-book"
            placeholder="Search existing or add a new beneficiary"
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
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="ben-addr">Beneficiary address</Label>
          <Textarea
            id="ben-addr"
            rows={3}
            value={beneficiaryAddress}
            onChange={(e) => setBeneficiaryAddress(e.target.value)}
          />
        </div>
      </Section>

      <Section title="LC value, currency & tolerance" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
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
            <Input id="lc-no" value={lcNumber} onChange={(e) => setLcNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doi">Date of issue</Label>
            <Input
              id="doi"
              type="date"
              value={dateOfIssue}
              onChange={(e) => setDateOfIssue(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        <p className="text-xs text-muted-foreground">
          Multiple amounts can be added for multiple transactions of the same beneficiary.
          Each line gets its own system transaction reference. Date of expiry cannot be
          before the latest shipment date, and the expected payment date cannot be before
          the date of expiry.
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
              <Label htmlFor={`exp-${i}`}>Date of expiry</Label>
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLines((prev) => [...prev, emptyLine()])}
          >
            <Plus className="mr-1 h-4 w-4" /> Add another transaction
          </Button>
          <p className="text-sm">
            <span className="text-muted-foreground">Total amount value: </span>
            <span className="font-semibold">{formatMoney(currency, total)}</span>
            <span className="text-muted-foreground"> ({tolerance} tolerance)</span>
          </p>
        </div>
      </Section>

      <Section title="Tenor" className="space-y-4">
        <div className="space-y-2">
          <Label>Sample tenor text</Label>
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
          <Label htmlFor="tenor-text">Tenor (editable)</Label>
          <Textarea
            id="tenor-text"
            rows={4}
            value={tenor}
            onChange={(e) => setTenor(e.target.value)}
          />
        </div>
      </Section>

      <Section title="Goods & shipment">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="goods">
            Goods description<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="goods"
            list="goods-book"
            value={goods}
            onChange={(e) => setGoods(e.target.value)}
          />
          <datalist id="goods-book">
            {goodsBook.map((n) => (
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
          <Label htmlFor="place-expiry">Place of expiry</Label>
          <Input
            id="place-expiry"
            placeholder="e.g. Counters of the negotiating bank"
            value={placeOfExpiry}
            onChange={(e) => setPlaceOfExpiry(e.target.value)}
          />
        </div>
        <MultiSelect
          label="Port of loading"
          options={LOADING_PORTS}
          values={loadingPorts}
          onChange={setLoadingPorts}
          placeholder="Select port(s) of loading"
        />
        <MultiSelect
          label="Port of discharge"
          options={DISCHARGE_PORTS}
          values={dischargePorts}
          onChange={setDischargePorts}
          placeholder="Select port(s) of discharge"
        />
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="advise-bank">Advise through bank</Label>
          <Input
            id="advise-bank"
            list="advise-book"
            value={adviseThroughBank}
            onChange={(e) => setAdviseThroughBank(e.target.value)}
          />
          <datalist id="advise-book">
            {ADVISING_BANKS.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </div>
      </Section>

      <Section title="Charges, documents & remarks" className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>A. Charge category</Label>
            <div className="space-y-2 pt-1">
              {CHARGE_CATEGORIES.map((c) => (
                <div key={c} className="flex items-center gap-2">
                  <Checkbox
                    id={`chg-${c}`}
                    checked={chargeCategories.includes(c)}
                    onCheckedChange={(v) =>
                      setChargeCategories((prev) =>
                        v ? [...prev, c] : prev.filter((x) => x !== c),
                      )
                    }
                  />
                  <Label htmlFor={`chg-${c}`} className="font-normal">
                    {c}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>B. Charges on account of</Label>
            <RadioGroup value={accountOf} onValueChange={setAccountOf} className="pt-1">
              {ACCOUNT_OF.map((a) => (
                <div key={a} className="flex items-center gap-2">
                  <RadioGroupItem value={a} id={`acc-${a}`} />
                  <Label htmlFor={`acc-${a}`} className="font-normal">
                    {a}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {accountOf === "Mixed" ? (
              <Input
                aria-label="Specify the mixed charge arrangement"
                placeholder="Please specify"
                value={mixedNote}
                onChange={(e) => setMixedNote(e.target.value)}
              />
            ) : null}
          </div>
        </div>

        <DocumentsField documents={documents} onChange={setDocuments} />

        <div className="space-y-2">
          <Label htmlFor="remarks">Remarks</Label>
          <Textarea
            id="remarks"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>
      </Section>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={openPreview}>
          Preview
        </Button>
        <Button type="button" onClick={submit}>
          Submit to FI
        </Button>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview before submit</DialogTitle>
          </DialogHeader>
          <dl className="divide-y divide-border text-sm">
            <PreviewRow label="Transaction type" value={cfg.label} />
            <PreviewRow label="Branch / unit" value={branch} />
            <PreviewRow
              label="Applicant"
              value={[applicantCif, applicantName, applicantAddress]
                .filter(Boolean)
                .join(" — ")}
            />
            <PreviewRow
              label="Beneficiary"
              value={[beneficiaryName, beneficiaryAddress].filter(Boolean).join(" — ")}
            />
            <PreviewRow
              label="LC value & currency"
              value={lines
                .map(
                  (l, i) =>
                    `${String(i + 1).padStart(2, "0")}. ${formatMoney(currency, Number(l.amount) || 0)}`,
                )
                .join(" ; ")}
            />
            <PreviewRow label="Total amount value" value={formatMoney(currency, total)} />
            <PreviewRow label="Tolerance" value={tolerance} />
            <PreviewRow label="Tenor" value={tenor} />
            <PreviewRow label="Goods description" value={goods} />
            <PreviewRow label="Country of origin" value={origins.join(", ")} />
            <PreviewRow
              label="Latest date of shipment"
              value={lines
                .map((l, i) => `${String(i + 1).padStart(2, "0")}. ${l.latestShipmentDate}`)
                .join(" ; ")}
            />
            <PreviewRow
              label="Date & place of expiry"
              value={lines
                .map(
                  (l, i) =>
                    `${String(i + 1).padStart(2, "0")}. ${l.expiryDate}${placeOfExpiry ? ` at ${placeOfExpiry}` : ""}`,
                )
                .join(" ; ")}
            />
            <PreviewRow label="Port of loading" value={loadingPorts.join(", ")} />
            <PreviewRow label="Port of discharge" value={dischargePorts.join(", ")} />
            <PreviewRow label="Advise through bank" value={adviseThroughBank} />
            <PreviewRow label="Charges" value={chargesLabel} />
            <PreviewRow label="Documents attached" value={documents.join(", ")} />
            <PreviewRow label="Remarks" value={remarks} />
          </dl>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Back to edit
            </Button>
            <Button onClick={submit}>Submit to FI</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
