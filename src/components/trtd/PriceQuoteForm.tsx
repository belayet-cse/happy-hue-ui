import { useRef, useState } from "react";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { offerPrices, type QuoteInput } from "@/lib/trtd/store";
import type { Session, Transaction } from "@/lib/trtd/types";

const EMPTY: QuoteInput = {
  bankName: "",
  pricingSummary: "",
  quoteToMitsSameAsRm: true,
  thirdBankMailFiles: [],
  confirmationRate: "",
  confirmationBasis: "From the date of confirmation till payment / maturity",
  confirmationMinCharge: "USD 500.00",
  financingBaseRate: "Term SOFR",
  financingMargin: "",
  financingBasis: "From the date of financing till payment at maturity",
  financingMinCharge: "USD 500.00",
  issuingToBank: "",
  maxDoorToDoorTenorDays: "180",
  maxSingleLcValue: "",
  reimbursementBank: "",
  includeInMt700: true,
  subjectToCreditApproval: true,
  validityDays: "30",
  validUntil: "",
  additionalConditions: "",
};

function optionLabel(i: number) {
  return `Option ${String(i + 1).padStart(2, "0")}`;
}

export function PriceQuoteForm({
  txn,
  session,
}: {
  txn: Transaction;
  session: Session;
}) {
  const [options, setOptions] = useState<QuoteInput[]>([{ ...EMPTY }]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const patch = (i: number, p: Partial<QuoteInput>) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...p } : o)));

  const validate = () => {
    for (let i = 0; i < options.length; i++) {
      const o = options[i]!;
      if (!o.bankName?.trim()) return `${optionLabel(i)}: bank name is required`;
      if (!o.pricingSummary?.trim() && !o.confirmationRate.trim() && !o.financingMargin.trim())
        return `${optionLabel(i)}: enter the pricing`;
      if ((o.additionalConditions || "").trim().split(/\s+/).filter(Boolean).length > 300)
        return `${optionLabel(i)}: additional condition is limited to 300 words`;
    }
    return null;
  };

  const submit = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    offerPrices(
      txn.id,
      session,
      options.map((o, i) => ({ ...o, optionNo: i + 1 })),
    );
    setOptions([{ ...EMPTY }]);
    setPreviewOpen(false);
    toast.success(
      options.length > 1
        ? `${options.length} bank pricing options sent — RM notified`
        : "Price offered — RM notified",
    );
  };

  return (
    <div className="space-y-4">
      {options.map((o, i) => (
        <div key={i} className="space-y-2 rounded-sm border border-border bg-surface p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-foreground uppercase">
              {optionLabel(i)}
            </p>
            {options.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Remove ${optionLabel(i)}`}
                onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="size-3.5" />
              </Button>
            ) : null}
          </div>

          <Field
            idx={i}
            label="Bank name"
            value={o.bankName ?? ""}
            onChange={(v) => patch(i, { bankName: v })}
            placeholder="e.g. KBC BANK BELGIUM"
          />
          <Field
            idx={i}
            label="Pricing"
            value={o.pricingSummary ?? ""}
            onChange={(v) => patch(i, { pricingSummary: v })}
            placeholder="e.g. SOFR PLUS 3.50%"
          />

          <ThirdBankMail
            files={o.thirdBankMailFiles ?? []}
            onChange={(files) => patch(i, { thirdBankMailFiles: files })}
          />

          <Field idx={i} label="Confirmation rate" value={o.confirmationRate} onChange={(v) => patch(i, { confirmationRate: v })} placeholder="e.g. 1.20% p.a." />
          <Field idx={i} label="Confirmation basis" value={o.confirmationBasis} onChange={(v) => patch(i, { confirmationBasis: v })} />
          <Field idx={i} label="Confirmation minimum" value={o.confirmationMinCharge} onChange={(v) => patch(i, { confirmationMinCharge: v })} />
          <Field idx={i} label="Financing base rate" value={o.financingBaseRate} onChange={(v) => patch(i, { financingBaseRate: v })} />
          <Field idx={i} label="Financing margin" value={o.financingMargin} onChange={(v) => patch(i, { financingMargin: v })} placeholder="e.g. 2.10% p.a." />
          <Field idx={i} label="Financing basis" value={o.financingBasis} onChange={(v) => patch(i, { financingBasis: v })} />
          <Field idx={i} label="Financing minimum" value={o.financingMinCharge} onChange={(v) => patch(i, { financingMinCharge: v })} />
          <Field idx={i} label="Confirming / financing bank" value={o.issuingToBank} onChange={(v) => patch(i, { issuingToBank: v })} />
          <Field idx={i} label="Max door-to-door tenor (days)" value={o.maxDoorToDoorTenorDays} onChange={(v) => patch(i, { maxDoorToDoorTenorDays: v })} />
          <Field idx={i} label="Max single LC value" value={o.maxSingleLcValue} onChange={(v) => patch(i, { maxSingleLcValue: v })} placeholder="e.g. USD 5,000,000.00" />
          <Field idx={i} label="Reimbursement bank" value={o.reimbursementBank} onChange={(v) => patch(i, { reimbursementBank: v })} />
          <Field idx={i} label="Validity (days)" value={o.validityDays} onChange={(v) => patch(i, { validityDays: v })} />
          <div className="space-y-1.5">
            <Label className="text-xs">Valid until</Label>
            <Input
              type="date"
              value={o.validUntil}
              onChange={(e) => patch(i, { validUntil: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Additional condition (max 300 words)</Label>
            <Textarea
              rows={3}
              value={o.additionalConditions}
              onChange={(e) => patch(i, { additionalConditions: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-foreground">
            <Checkbox
              checked={o.includeInMt700}
              onCheckedChange={(c) => patch(i, { includeInMt700: c === true })}
            />
            Include confirmation instruction in MT700
          </label>
          <label className="flex items-center gap-2 text-xs text-foreground">
            <Checkbox
              checked={o.subjectToCreditApproval}
              onCheckedChange={(c) => patch(i, { subjectToCreditApproval: c === true })}
            />
            Subject to counterparty credit approval
          </label>
          <label className="flex items-center gap-2 text-xs text-foreground">
            <Checkbox
              checked={o.quoteToMitsSameAsRm !== false}
              onCheckedChange={(c) => patch(i, { quoteToMitsSameAsRm: c === true })}
            />
            Price quote to MITS: same as RM
          </label>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setOptions((prev) => [...prev, { ...EMPTY }])}
      >
        <Plus className="size-4" /> Add another bank pricing
      </Button>

      <Button
        className="w-full"
        onClick={() => {
          const err = validate();
          if (err) {
            toast.error(err);
            return;
          }
          setPreviewOpen(true);
        }}
      >
        Preview &amp; send {options.length > 1 ? `${options.length} options` : "price"}
      </Button>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Price quote preview — {txn.referenceNo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {options.map((o, i) => (
              <dl key={i} className="divide-y divide-border rounded-sm border border-border">
                <div className="bg-surface px-3 py-2 text-xs font-semibold uppercase">
                  {optionLabel(i)}
                </div>
                <Row label="Bank name" value={o.bankName ?? ""} />
                <Row label="Pricing" value={o.pricingSummary ?? ""} />
                <Row label="Confirmation rate" value={o.confirmationRate} />
                <Row label="Financing" value={`${o.financingBaseRate} ${o.financingMargin}`.trim()} />
                <Row label="Validity" value={`${o.validityDays} days${o.validUntil ? ` · until ${o.validUntil}` : ""}`} />
                <Row label="Additional condition" value={o.additionalConditions} />
                <Row
                  label="Third bank pricing mail"
                  value={(o.thirdBankMailFiles ?? []).join(", ") || "—"}
                />
                <Row
                  label="Quote to MITS"
                  value={o.quoteToMitsSameAsRm !== false ? "Same as RM" : "Separate"}
                />
              </dl>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Back to edit
            </Button>
            <Button onClick={submit}>Send to RM</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ThirdBankMail({
  files,
  onChange,
}: {
  files: string[];
  onChange: (files: string[]) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        Third bank pricing mail (visible to MFIS only)
      </Label>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()}>
          <Upload className="size-3.5" /> Attach mail / file
        </Button>
        <input
          ref={ref}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? []).map((f) => f.name);
            if (picked.length) onChange([...files, ...picked]);
            e.target.value = "";
          }}
        />
      </div>
      {files.length ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {files.map((f, i) => (
            <Badge key={`${f}-${i}`} variant="secondary" className="gap-1">
              {f}
              <button
                type="button"
                aria-label={`Remove ${f}`}
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  idx = 0,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  idx?: number;
}) {
  const id = `pq-${idx}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(140px,32%)_1fr] gap-3 px-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-line text-foreground">{value || "—"}</dd>
    </div>
  );
}
