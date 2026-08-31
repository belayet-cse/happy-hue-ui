import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  ADVISING_BANKS,
  CURRENCIES,
  DocumentsField,
  PreviewRow,
  Section,
} from "@/components/trtd/FormKit";
import { Button } from "@/components/ui/button";
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
import { blankDetails, type Session } from "@/lib/trtd/types";

/** One presented document set — repeatable. */
interface Presentation {
  documentSetReference: string;
  currency: string;
  billAmount: string;
  presentationDate: string;
  maturityDate: string;
}

const emptySet = (): Presentation => ({
  documentSetReference: "",
  currency: "USD",
  billAmount: "",
  presentationDate: "",
  maturityDate: "",
});

/** Import 1.3 — documents presented at a bank other than the designated bank. */
export function NonDesignatedForm({ session }: { session: Session }) {
  const navigate = useNavigate();

  const [lcNumber, setLcNumber] = useState("");
  const [dateOfIssue, setDateOfIssue] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryAddress, setBeneficiaryAddress] = useState("");
  const [presentingBank, setPresentingBank] = useState("");
  const [designatedBank, setDesignatedBank] = useState("");
  const [reason, setReason] = useState("");
  const [sets, setSets] = useState<Presentation[]>([emptySet()]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [remarks, setRemarks] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const setSet = (i: number, patch: Partial<Presentation>) =>
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const currency = sets[0]?.currency ?? "USD";
  const total = sets.reduce((sum, s) => sum + (Number(s.billAmount) || 0), 0);

  const validate = (): string | null => {
    if (!lcNumber.trim()) return "LC number is required";
    if (!applicantName.trim()) return "Applicant name is required";
    if (!beneficiaryName.trim()) return "Beneficiary name is required";
    if (!presentingBank.trim()) return "Presenting bank is required";
    if (!designatedBank.trim()) return "Designated bank is required";
    if (!reason.trim()) return "Reason for non-designated presentation is required";
    for (const [i, s] of sets.entries()) {
      const no = `Presentation ${String(i + 1).padStart(2, "0")}`;
      if (!Number(s.billAmount)) return `${no}: bill amount is required`;
      if (!s.presentationDate) return `${no}: presentation date is required`;
      if (s.maturityDate && s.maturityDate < s.presentationDate)
        return `${no}: maturity date cannot be before the presentation date`;
    }
    return null;
  };

  const submit = () => {
    const err = validate();
    if (err) return void toast.error(err);

    const ids = sets.map((s) =>
      createRequest({
        requestType: "NON_DESIGNATED",
        module: "IMPORT",
        subDivision: "1.3 Non-Designated Presentation",
        actor: session,
        details: {
          ...blankDetails(),
          lcNumber,
          dateOfIssue,
          currency: s.currency,
          amount: Number(s.billAmount),
          applicantName: applicantName.trim(),
          applicantAddress,
          beneficiaryName: beneficiaryName.trim(),
          beneficiaryAddress,
          presentingBank: presentingBank.trim(),
          designatedBank: designatedBank.trim(),
          documentSetReference: s.documentSetReference,
          presentationDate: s.presentationDate,
          maturityDate: s.maturityDate,
          nonDesignatedReason: reason,
          tenorOfDraft: s.maturityDate
            ? `Bill matures on ${s.maturityDate}`
            : "At sight presentation",
          attachments: documents,
          lcCopyFileName: documents[0] ?? "",
          remarks,
        },
      }),
    );

    setPreviewOpen(false);
    toast.success(
      ids.length > 1
        ? `${ids.length} non-designated presentations submitted to FI (MFIS)`
        : "Non-designated presentation submitted to FI (MFIS) — notification sent",
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
          <Label htmlFor="nd-lc">
            LC number<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input id="nd-lc" value={lcNumber} onChange={(e) => setLcNumber(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nd-doi">Date of issue</Label>
          <Input
            id="nd-doi"
            type="date"
            value={dateOfIssue}
            onChange={(e) => setDateOfIssue(e.target.value)}
          />
        </div>
      </Section>

      <Section title="Applicant">
        <div className="space-y-2">
          <Label htmlFor="nd-app">
            Applicant full name<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="nd-app"
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nd-app-addr">Applicant address</Label>
          <Textarea
            id="nd-app-addr"
            rows={3}
            value={applicantAddress}
            onChange={(e) => setApplicantAddress(e.target.value)}
          />
        </div>
      </Section>

      <Section title="Beneficiary">
        <div className="space-y-2">
          <Label htmlFor="nd-ben">
            Beneficiary full name<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="nd-ben"
            value={beneficiaryName}
            onChange={(e) => setBeneficiaryName(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nd-ben-addr">Beneficiary address</Label>
          <Textarea
            id="nd-ben-addr"
            rows={3}
            value={beneficiaryAddress}
            onChange={(e) => setBeneficiaryAddress(e.target.value)}
          />
        </div>
      </Section>

      <Section title="Banks">
        <div className="space-y-2">
          <Label htmlFor="nd-presenting">
            Presenting bank<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="nd-presenting"
            list="nd-bank-book"
            placeholder="Bank where documents were presented"
            value={presentingBank}
            onChange={(e) => setPresentingBank(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nd-designated">
            Designated bank<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="nd-designated"
            list="nd-bank-book"
            placeholder="Bank nominated under the LC"
            value={designatedBank}
            onChange={(e) => setDesignatedBank(e.target.value)}
          />
        </div>
        <datalist id="nd-bank-book">
          {ADVISING_BANKS.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nd-reason">
            Reason for non-designated presentation
            <span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Textarea
            id="nd-reason"
            rows={3}
            placeholder="e.g. Beneficiary presented documents to its own bank instead of the nominated bank"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </Section>

      <Section title="Presentation details" className="space-y-5">
        <p className="text-xs text-muted-foreground">
          Document set reference, bill amount, presentation date and maturity date are
          captured together. Add another presentation for each additional document set
          under the same LC — each one gets its own system transaction reference.
        </p>

        {sets.map((s, i) => (
          <div key={i} className="space-y-4 rounded-md border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                Presentation {String(i + 1).padStart(2, "0")}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={sets.length === 1}
                onClick={() => setSets((prev) => prev.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="mr-1 h-4 w-4" /> Remove
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={`nd-set-${i}`}>Document set reference</Label>
                <Input
                  id={`nd-set-${i}`}
                  value={s.documentSetReference}
                  onChange={(e) => setSet(i, { documentSetReference: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={s.currency} onValueChange={(v) => setSet(i, { currency: v })}>
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
                <Label htmlFor={`nd-amt-${i}`}>
                  Bill amount<span className="ml-0.5 text-destructive">*</span>
                </Label>
                <Input
                  id={`nd-amt-${i}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={s.billAmount}
                  onChange={(e) => setSet(i, { billAmount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`nd-pres-${i}`}>
                  Presentation date<span className="ml-0.5 text-destructive">*</span>
                </Label>
                <Input
                  id={`nd-pres-${i}`}
                  type="date"
                  value={s.presentationDate}
                  onChange={(e) => setSet(i, { presentationDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`nd-mat-${i}`}>Maturity date</Label>
                <Input
                  id={`nd-mat-${i}`}
                  type="date"
                  value={s.maturityDate}
                  onChange={(e) => setSet(i, { maturityDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSets((prev) => [...prev, emptySet()])}
          >
            <Plus className="mr-1 h-4 w-4" /> Add another presentation
          </Button>
          <p className="text-sm">
            <span className="text-muted-foreground">Total amount value: </span>
            <span className="font-semibold">{formatMoney(currency, total)}</span>
          </p>
        </div>
      </Section>

      <Section title="Documents & remarks" className="space-y-5">
        <DocumentsField
          documents={documents}
          onChange={setDocuments}
          hint="Attach the LC copy, presented document set, covering schedule of the presenting bank and any correspondence."
        />
        <div className="space-y-2">
          <Label htmlFor="nd-remarks">Remarks</Label>
          <Textarea
            id="nd-remarks"
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
            <DialogTitle>Preview non-designated presentation</DialogTitle>
            <DialogDescription>
              Review the request before it is submitted to the FI desk. Nothing is sent
              until you confirm.
            </DialogDescription>
          </DialogHeader>

          <dl className="divide-y divide-border text-sm">
            <PreviewRow label="LC number" value={lcNumber} />
            <PreviewRow label="Date of issue" value={dateOfIssue} />
            <PreviewRow label="Applicant" value={applicantName} />
            <PreviewRow label="Beneficiary" value={beneficiaryName} />
            <PreviewRow label="Presenting bank" value={presentingBank} />
            <PreviewRow label="Designated bank" value={designatedBank} />
            <PreviewRow label="Reason" value={reason} />
            <PreviewRow
              label="Presentations"
              value={sets
                .map(
                  (s, i) =>
                    `${i + 1}. ${s.documentSetReference || "—"} — ${formatMoney(
                      s.currency,
                      Number(s.billAmount) || 0,
                    )} — presented ${s.presentationDate}${
                      s.maturityDate ? ` — matures ${s.maturityDate}` : ""
                    }`,
                )
                .join("\n")}
            />
            <PreviewRow label="Total amount value" value={formatMoney(currency, total)} />
            <PreviewRow
              label="Documents attached"
              value={documents.length ? documents.join(", ") : "None"}
            />
            <PreviewRow label="Remarks" value={remarks} />
          </dl>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPreviewOpen(false)}>
              Back to edit
            </Button>
            <Button type="button" onClick={submit}>
              Confirm &amp; submit to FI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
