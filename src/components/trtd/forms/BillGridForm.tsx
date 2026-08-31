import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  CURRENCIES,
  DocumentsField,
  PreviewRow,
  Section,
} from "@/components/trtd/FormKit";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/trtd/format";
import { createRequest } from "@/lib/trtd/store";
import { blankDetails, type BillRow, type Session } from "@/lib/trtd/types";

type Mode = "REFINANCE" | "MATURITY_EXT" | "OTHER_BANK";

const COPY: Record<Mode, { title: string; hint: string; success: string }> = {
  REFINANCE: {
    title: "Bills to be refinanced",
    hint: "Add one row per accepted bill to be refinanced. Multiple bills of the same applicant can be submitted together.",
    success: "Refinance request submitted to FI (MFIS)",
  },
  MATURITY_EXT: {
    title: "Bills for maturity extension",
    hint: "Add one row per bill. Enter the extension in days — the new maturity date is calculated automatically.",
    success: "Maturity extension request submitted to FI (MFIS)",
  },
  OTHER_BANK: {
    title: "Bills for refinance — other bank LC",
    hint: "All bill data is keyed in because the LC is issued by another bank. Add one row per bill; the new maturity date is calculated from the maturity date and extension days.",
    success: "Other bank's transaction request submitted to FI (MFIS)",
  },
};


const emptyRow = (): BillRow => ({
  lcNumber: "",
  applicantName: "",
  billReference: "",
  currency: "USD",
  billAmount: 0,
  discountingBankName: "",
  maturityDate: "",
  extensionDays: 0,
  newMaturityDate: "",
});

function addDays(date: string, days: number): string {
  if (!date || !days) return "";
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 1.1.4 Refinance and 1.1.5 Maturity Extension — both are bill-grid requests. */
export function BillGridForm({ mode, session }: { mode: Mode; session: Session }) {
  const navigate = useNavigate();
  const copy = COPY[mode];

  const [rows, setRows] = useState<BillRow[]>([emptyRow()]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [remarks, setRemarks] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const setRow = (i: number, patch: Partial<BillRow>) =>
    setRows((prev) =>
      prev.map((r, idx) => {
        if (idx !== i) return r;
        const next = { ...r, ...patch };
        if (mode === "MATURITY_EXT")
          next.newMaturityDate = addDays(next.maturityDate, Number(next.extensionDays));
        return next;
      }),
    );

  const validate = (): string | null => {
    for (const [i, r] of rows.entries()) {
      const no = `Row ${i + 1}`;
      if (!r.lcNumber.trim()) return `${no}: LC number is required`;
      if (!r.applicantName.trim()) return `${no}: applicant name is required`;
      if (!r.billAmount) return `${no}: bill amount is required`;
      if (!r.maturityDate) return `${no}: maturity date is required`;
      if (mode === "MATURITY_EXT" && !Number(r.extensionDays))
        return `${no}: extension days are required`;
    }
    return null;
  };

  const submit = () => {
    const err = validate();
    if (err) return void toast.error(err);

    const first = rows[0]!;
    const total = rows.reduce((s, r) => s + Number(r.billAmount || 0), 0);

    const id = createRequest({
      requestType: mode === "REFINANCE" ? "REFINANCE" : "MATURITY_EXT",
      module: "IMPORT",
      subDivision: "1.1 MTB Transaction Request",
      actor: session,
      details: {
        ...blankDetails(),
        lcNumber: rows.map((r) => r.lcNumber).join(", "),
        currency: first.currency,
        amount: total,
        applicantName: first.applicantName,
        bills: rows,
        tenorOfDraft:
          mode === "REFINANCE"
            ? "Refinance of accepted bills under MTB LC"
            : "Extension of maturity of accepted bills under MTB LC",
        attachments: documents,
        lcCopyFileName: documents[0] ?? "",
        remarks,
      },
    });

    setPreviewOpen(false);
    toast.success(copy.success);
    navigate({ to: "/requests/$id", params: { id } });
  };

  return (
    <div className="space-y-6">
      <Section title="Transaction" className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>System transaction reference number</Label>
          <Input value="Auto generated on submit" readOnly disabled />
        </div>
      </Section>

      <Section title={copy.title} className="space-y-4">
        <p className="text-xs text-muted-foreground">{copy.hint}</p>

        {rows.map((r, i) => (
          <div
            key={i}
            className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="space-y-2">
              <Label htmlFor={`bg-lc-${i}`}>LC number</Label>
              <Input
                id={`bg-lc-${i}`}
                value={r.lcNumber}
                onChange={(e) => setRow(i, { lcNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`bg-app-${i}`}>Applicant name</Label>
              <Input
                id={`bg-app-${i}`}
                value={r.applicantName}
                onChange={(e) => setRow(i, { applicantName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`bg-ref-${i}`}>Bill reference</Label>
              <Input
                id={`bg-ref-${i}`}
                value={r.billReference}
                onChange={(e) => setRow(i, { billReference: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`bg-bank-${i}`}>Discounting bank</Label>
              <Input
                id={`bg-bank-${i}`}
                value={r.discountingBankName}
                onChange={(e) => setRow(i, { discountingBankName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={r.currency} onValueChange={(v) => setRow(i, { currency: v })}>
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
              <Label htmlFor={`bg-amt-${i}`}>Bill amount</Label>
              <Input
                id={`bg-amt-${i}`}
                type="number"
                min="0"
                step="0.01"
                value={r.billAmount || ""}
                onChange={(e) => setRow(i, { billAmount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`bg-mat-${i}`}>Maturity date</Label>
              <Input
                id={`bg-mat-${i}`}
                type="date"
                value={r.maturityDate}
                onChange={(e) => setRow(i, { maturityDate: e.target.value })}
              />
            </div>
            {mode === "MATURITY_EXT" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor={`bg-ext-${i}`}>Extension (days)</Label>
                  <Input
                    id={`bg-ext-${i}`}
                    type="number"
                    min="0"
                    value={r.extensionDays || ""}
                    onChange={(e) => setRow(i, { extensionDays: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`bg-new-${i}`}>New maturity date</Label>
                  <Input id={`bg-new-${i}`} value={r.newMaturityDate} readOnly disabled />
                </div>
              </>
            ) : null}
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={rows.length === 1}
                onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
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
          onClick={() => setRows((prev) => [...prev, emptyRow()])}
        >
          <Plus className="mr-1 h-4 w-4" /> Add bill
        </Button>
      </Section>

      <Section title="Documents & remarks" className="space-y-5">
        <DocumentsField
          documents={documents}
          onChange={setDocuments}
          hint="Attach the acceptance advice, bill of exchange copy and any supporting document."
        />
        <div className="space-y-2">
          <Label htmlFor="bg-remarks">Remarks</Label>
          <Textarea
            id="bg-remarks"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>
      </Section>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const err = validate();
            if (err) return void toast.error(err);
            setPreviewOpen(true);
          }}
        >
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
            <PreviewRow
              label="Request"
              value={
                mode === "REFINANCE"
                  ? "Refinance MTB Transaction"
                  : "Maturity Extension Request"
              }
            />
            <PreviewRow
              label="Bills"
              value={rows
                .map(
                  (r, i) =>
                    `${i + 1}. ${r.lcNumber} / ${r.billReference || "—"} — ${formatMoney(r.currency, r.billAmount)} — matures ${r.maturityDate}${
                      mode === "MATURITY_EXT"
                        ? ` → +${r.extensionDays}d → ${r.newMaturityDate || "—"}`
                        : ""
                    }`,
                )
                .join("\n")}
            />
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
