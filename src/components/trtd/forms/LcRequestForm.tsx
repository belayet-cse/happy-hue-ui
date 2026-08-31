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
  Section,
  TOLERANCES,
} from "@/components/trtd/FormKit";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

/** Which request the form is capturing — LC Confirmation, UPAS LC or an other-bank LC. */
export type LcFormVariant = "CONFIRMATION" | "UPAS" | "OTHER_BANK";

export type TxnTypeKey = "CONF_SIGHT" | "CONF_DEFERRED" | "CONF_DISC" | "POST_ACC_DISC";

/** Tenor drop-down list — identical for LC Confirmation and UPAS LC requests. */
const TENOR_OPTIONS: string[] = [
  "At Sight (From the date of LC issuance to LC expiry)",
  "At Sight (From the date of LC issuance to maturity of the Bill)",
  "Add Confirmation- From the date of LC issuance to till Negotiation/LC expiry and Discounting- XXX Days from the LC issuance/negotiation/acceptance/Bill of Lading, Beneficiary will receive payment At Sight/XXX days after LC issuance/acceptance/Bill of Lading",
  "Discounting- XXX Days from the LC issuance/negotiation/acceptance/Bill of Lading, Beneficiary will receive payment At Sight/XXX days after LC issuance/acceptance/Bill of Lading",
  "Other Pls specify",
];

const TXN_TYPES: Record<
  TxnTypeKey,
  { label: string; requestType: RequestType; lcType: LcType; tenorSamples: string[] }
> = {
  CONF_SIGHT: {
    label: "Add Confirmation Only — At Sight LC",
    requestType: "CONFIRMATION",
    lcType: "AT_SIGHT",
    tenorSamples: TENOR_OPTIONS,
  },
  CONF_DEFERRED: {
    label: "Add Confirmation Only — Deferred LC",
    requestType: "CONFIRMATION",
    lcType: "DEFERRED",
    tenorSamples: TENOR_OPTIONS,
  },
  CONF_DISC: {
    label: "Confirmation and Discounting",
    requestType: "ADD_CONF_DISC",
    lcType: "UPAS",
    tenorSamples: TENOR_OPTIONS,
  },
  POST_ACC_DISC: {
    label: "Post Acceptance Discounting",
    requestType: "DISCOUNTING",
    lcType: "UPAS",
    tenorSamples: TENOR_OPTIONS,
  },
};

const VARIANT_OPTIONS: Record<LcFormVariant, TxnTypeKey[]> = {
  CONFIRMATION: ["CONF_SIGHT", "CONF_DEFERRED"],
  UPAS: ["CONF_DISC", "POST_ACC_DISC"],
};

const CHARGE_CATEGORIES = ["Confirmation charges", "Discounting charges"];
const ACCOUNT_OF = ["Applicant", "Beneficiary", "Mixed"];

/** One clubbed transaction detail line — repeatable. */
interface Line {
  currency: string;
  amount: string;
  tolerance: string;
  tenor: string;
  goods: string;
  origins: string[];
  latestShipmentDate: string;
  expiryDate: string;
  placeOfExpiry: string;
  expectedPaymentDate: string;
  loadingPorts: string[];
  dischargePorts: string[];
  adviseThroughBank: string;
  chargeCategories: string[];
  accountOf: string;
  mixedNote: string;
}

const defaultCharges = (key: TxnTypeKey) =>
  key === "POST_ACC_DISC"
    ? ["Discounting charges"]
    : key === "CONF_DISC"
      ? ["Confirmation charges", "Discounting charges"]
      : ["Confirmation charges"];

const emptyLine = (key: TxnTypeKey): Line => ({
  currency: "USD",
  amount: "",
  tolerance: "Nil",
  tenor: TXN_TYPES[key].tenorSamples[0] ?? "",
  goods: "",
  origins: [],
  latestShipmentDate: "",
  expiryDate: "",
  placeOfExpiry: "",
  expectedPaymentDate: "",
  loadingPorts: [],
  dischargePorts: [],
  adviseThroughBank: "",
  chargeCategories: defaultCharges(key),
  accountOf: "Applicant",
  mixedNote: "",
});

const chargesLabelOf = (l: Line) =>
  [
    l.chargeCategories.join(" + ") || "—",
    `on ${l.accountOf === "Mixed" ? `mixed account (${l.mixedNote || "please specify"})` : `${l.accountOf}'s account`}`,
  ].join(" ");

export function LcRequestForm({
  session,
  variant = "CONFIRMATION",
}: {
  session: Session;
  variant?: LcFormVariant;
}) {
  const navigate = useNavigate();
  const { transactions } = useTrtdStore();

  const typeKeys = VARIANT_OPTIONS[variant];
  const [txnTypeKey, setTxnTypeKey] = useState<TxnTypeKey>(typeKeys[0] as TxnTypeKey);
  const cfg = TXN_TYPES[txnTypeKey];

  const [applicantCif, setApplicantCif] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryAddress, setBeneficiaryAddress] = useState("");
  const [lcNumber, setLcNumber] = useState("");
  const [dateOfIssue, setDateOfIssue] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine(typeKeys[0] as TxnTypeKey)]);
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
    setLines((prev) =>
      prev.map((l) => ({
        ...l,
        tenor: TXN_TYPES[key].tenorSamples[0] ?? "",
        chargeCategories: defaultCharges(key),
      })),
    );
  };

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const currency = lines[0]?.currency ?? "USD";
  const total = lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  const validate = (): string | null => {
    if (!applicantName.trim()) return "Applicant full name is required";
    if (!beneficiaryName.trim()) return "Beneficiary full name is required";
    if (!lines.length) return "At least one LC details block is required";
    for (const [i, l] of lines.entries()) {
      const no = `LC ${String(i + 1).padStart(2, "0")}`;
      if (!Number(l.amount)) return `${no}: LC value is required`;
      if (!l.goods.trim()) return `${no}: goods description is required`;
      if (!l.chargeCategories.length) return `${no}: select at least one charge category`;
      if (l.accountOf === "Mixed" && !l.mixedNote.trim())
        return `${no}: please specify the mixed charge arrangement`;
      if (!l.latestShipmentDate) return `${no}: latest date of shipment is required`;
      if (!l.expiryDate) return `${no}: date of expiry is required`;
      if (l.expiryDate < l.latestShipmentDate)
        return `${no}: date of expiry cannot be before the latest shipment date`;
      if (l.expectedPaymentDate && l.expectedPaymentDate < l.expiryDate)
        return `${no}: expected payment date cannot be before the LC expiry date`;
    }
    return null;
  };

  const submit = () => {
    const err = validate();
    if (err) return void toast.error(err);

    const ids = lines.map((l) =>
      createRequest({
        requestType: cfg.requestType,
        module: "IMPORT",
        subDivision: "1.1 MTB Transaction Request",
        actor: session,
        details: {
          ...blankDetails(),
          lcNumber,
          dateOfIssue,
          currency: l.currency,
          amount: Number(l.amount),
          tolerance: l.tolerance,
          expectedPaymentDate: l.expectedPaymentDate,
          attachments: documents,
          lcType: cfg.lcType,
          tenorOfDraft: l.tenor,
          confirmationInstruction:
            cfg.requestType === "DISCOUNTING" ? "NOT_REQUIRED" : "REQUIRED",
          applicantName: applicantName.trim(),
          applicantAddress,
          beneficiaryName: beneficiaryName.trim(),
          beneficiaryAddress,
          goodsDescription: l.goods,
          countryOfOrigin: l.origins.join(", "),
          portOfLoading: l.loadingPorts.join(", "),
          portOfDischarge: l.dischargePorts.join(", "),
          latestShipmentDate: l.latestShipmentDate,
          expiryDate: l.expiryDate,
          placeOfExpiry: l.placeOfExpiry,
          adviseThroughBank: l.adviseThroughBank,
          chargeCategories: l.chargeCategories,
          chargesOnAccountOf:
            l.accountOf === "Mixed" ? `Mixed — ${l.mixedNote}` : l.accountOf,
          chargesBorneBy: chargesLabelOf(l),
          remarks,
          lcCopyFileName: documents[0] ?? "",
        },
      }),
    );

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
        <div className="space-y-2 sm:col-span-2">
          <Label>{variant === "UPAS" ? "UPAS LC request type" : "Transaction type"}</Label>
          <Select value={txnTypeKey} onValueChange={(v) => changeType(v as TxnTypeKey)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeKeys.map((k) => (
                <SelectItem key={k} value={k}>
                  {TXN_TYPES[k].label}
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
      </Section>

      <Section title="Applicant">
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
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="app-addr">Applicant address</Label>
          <Textarea
            id="app-addr"
            rows={3}
            value={applicantAddress}
            onChange={(e) => setApplicantAddress(e.target.value)}
          />
        </div>
      </Section>

      <Section title="Beneficiary">
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

      <Section title="LC details" className="space-y-5">
        <p className="text-xs text-muted-foreground">
          LC value, tolerance, tenor, goods, origin, shipment and expiry, ports, advise
          through bank and charges are captured together. Add another LC details block for
          each additional LC of the same beneficiary — each block gets its own system
          transaction reference.
        </p>

        {lines.map((l, i) => (
          <div key={i} className="space-y-4 rounded-md border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                LC {String(i + 1).padStart(2, "0")} details
              </p>
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

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={l.currency}
                  onValueChange={(v) => setLine(i, { currency: v })}
                >
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
                <Label htmlFor={`amt-${i}`}>
                  LC value<span className="ml-0.5 text-destructive">*</span>
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
                <Label>Tolerance (+/-)</Label>
                <Select
                  value={l.tolerance}
                  onValueChange={(v) => setLine(i, { tolerance: v })}
                >
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
            </div>

            <div className="space-y-2">
              <Label>Tenor</Label>
              <Select
                value={cfg.tenorSamples.includes(l.tenor) ? l.tenor : ""}
                onValueChange={(v) => setLine(i, { tenor: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select tenor" />
                </SelectTrigger>
                <SelectContent>
                  {cfg.tenorSamples.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.length > 90 ? `${s.slice(0, 90)}…` : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                aria-label={`Tenor for transaction ${i + 1}`}
                rows={3}
                value={l.tenor}
                onChange={(e) => setLine(i, { tenor: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`goods-${i}`}>
                  Goods description<span className="ml-0.5 text-destructive">*</span>
                </Label>
                <Input
                  id={`goods-${i}`}
                  list="goods-book"
                  value={l.goods}
                  onChange={(e) => setLine(i, { goods: e.target.value })}
                />
              </div>
              <MultiSelect
                label="Country of origin"
                options={COUNTRIES}
                values={l.origins}
                onChange={(v) => setLine(i, { origins: v })}
                placeholder="Select country / countries"
              />
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
                <Label htmlFor={`place-${i}`}>Place of expiry</Label>
                <Input
                  id={`place-${i}`}
                  placeholder="e.g. Counters of the negotiating bank"
                  value={l.placeOfExpiry}
                  onChange={(e) => setLine(i, { placeOfExpiry: e.target.value })}
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
              <MultiSelect
                label="Port of loading"
                options={LOADING_PORTS}
                values={l.loadingPorts}
                onChange={(v) => setLine(i, { loadingPorts: v })}
                placeholder="Select port(s) of loading"
              />
              <MultiSelect
                label="Port of discharge"
                options={DISCHARGE_PORTS}
                values={l.dischargePorts}
                onChange={(v) => setLine(i, { dischargePorts: v })}
                placeholder="Select port(s) of discharge"
              />
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`advise-${i}`}>Advise through bank</Label>
                <Input
                  id={`advise-${i}`}
                  list="advise-book"
                  value={l.adviseThroughBank}
                  onChange={(e) => setLine(i, { adviseThroughBank: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Charges — category</Label>
                <div className="space-y-2 pt-1">
                  {CHARGE_CATEGORIES.map((c) => (
                    <div key={c} className="flex items-center gap-2">
                      <Checkbox
                        id={`chg-${i}-${c}`}
                        checked={l.chargeCategories.includes(c)}
                        onCheckedChange={(v) =>
                          setLine(i, {
                            chargeCategories: v
                              ? [...l.chargeCategories, c]
                              : l.chargeCategories.filter((x) => x !== c),
                          })
                        }
                      />
                      <Label htmlFor={`chg-${i}-${c}`} className="font-normal">
                        {c}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Charges on account of</Label>
                <RadioGroup
                  value={l.accountOf}
                  onValueChange={(v) => setLine(i, { accountOf: v })}
                  className="pt-1"
                >
                  {ACCOUNT_OF.map((a) => (
                    <div key={a} className="flex items-center gap-2">
                      <RadioGroupItem value={a} id={`acc-${i}-${a}`} />
                      <Label htmlFor={`acc-${i}-${a}`} className="font-normal">
                        {a}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {l.accountOf === "Mixed" ? (
                  <Input
                    aria-label={`Specify the mixed charge arrangement for transaction ${i + 1}`}
                    placeholder="Please specify"
                    value={l.mixedNote}
                    onChange={(e) => setLine(i, { mixedNote: e.target.value })}
                  />
                ) : null}
              </div>
            </div>
          </div>
        ))}

        <datalist id="goods-book">
          {goodsBook.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <datalist id="advise-book">
          {ADVISING_BANKS.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLines((prev) => [...prev, emptyLine(txnTypeKey)])}
          >
            <Plus className="mr-1 h-4 w-4" /> Add another LC details
          </Button>
          <p className="text-sm">
            <span className="text-muted-foreground">Total amount value: </span>
            <span className="font-semibold">{formatMoney(currency, total)}</span>
          </p>
        </div>
      </Section>

      <Section title="Documents & remarks" className="space-y-5">
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
        <Button
          type="button"
          onClick={() => {
            const err = validate();
            if (err) return void toast.error(err);
            setPreviewOpen(true);
          }}
        >
          Submit to FI
        </Button>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview transaction request</DialogTitle>
            <DialogDescription>
              Review the request before it is submitted to the FI desk. Nothing is sent until
              you confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 text-sm">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Transaction
              </p>
              <PreviewRow label="Request type" value={cfg.label} />
              <PreviewRow label="LC number" value={lcNumber || "—"} />
              <PreviewRow label="Date of issue" value={dateOfIssue || "—"} />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Applicant
              </p>
              <PreviewRow label="Name" value={applicantName} />
              <PreviewRow label="Address" value={applicantAddress || "—"} />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Beneficiary
              </p>
              <PreviewRow label="Name" value={beneficiaryName} />
              <PreviewRow label="Address" value={beneficiaryAddress || "—"} />
            </div>

            {lines.map((l, i) => (
              <div key={i} className="space-y-1 rounded-md border border-border p-3">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  LC {String(i + 1).padStart(2, "0")} details
                </p>
                <PreviewRow
                  label="LC value"
                  value={`${formatMoney(l.currency, Number(l.amount) || 0)} (tolerance ${l.tolerance})`}
                />
                <PreviewRow label="Tenor" value={l.tenor || "—"} />
                <PreviewRow label="Goods description" value={l.goods} />
                <PreviewRow label="Country of origin" value={l.origins.join(", ") || "—"} />
                <PreviewRow label="Latest date of shipment" value={l.latestShipmentDate} />
                <PreviewRow
                  label="Date and place of expiry"
                  value={`${l.expiryDate}${l.placeOfExpiry ? ` — ${l.placeOfExpiry}` : ""}`}
                />
                <PreviewRow label="Port of loading" value={l.loadingPorts.join(", ") || "—"} />
                <PreviewRow
                  label="Port of discharge"
                  value={l.dischargePorts.join(", ") || "—"}
                />
                <PreviewRow
                  label="Advise through bank"
                  value={l.adviseThroughBank || "—"}
                />
                <PreviewRow label="Charges" value={chargesLabelOf(l)} />
              </div>
            ))}

            <div className="space-y-1">
              <PreviewRow
                label="Total amount value"
                value={formatMoney(currency, total)}
              />
              <PreviewRow
                label="Documents attached"
                value={documents.length ? documents.join(", ") : "None"}
              />
              <PreviewRow label="Remarks" value={remarks || "—"} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPreviewOpen(false)}>
              Back to edit
            </Button>
            <Button
              type="button"
              onClick={() => {
                setPreviewOpen(false);
                submit();
              }}
            >
              Confirm & submit to FI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-0.5">
      <span className="w-48 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{value}</span>
    </div>
  );
}
