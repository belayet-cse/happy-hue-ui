import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DocumentsField, PreviewRow, Section } from "@/components/trtd/FormKit";
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
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/trtd/format";
import { createRequest, useTrtdStore } from "@/lib/trtd/store";
import { blankDetails, type Session, type Transaction } from "@/lib/trtd/types";

/** Read-only auto-captured field. */
function AutoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground">{label}</Label>
      <Input value={value || "—"} readOnly disabled />
    </div>
  );
}

/** Amendment Request — LC number input, rest auto-captured, amendments typed by RM. */
export function AmendmentForm({ session }: { session: Session }) {
  const navigate = useNavigate();
  const { transactions } = useTrtdStore();

  const sourceOptions = useMemo(
    () => transactions.filter((t) => t.details.lcNumber),
    [transactions],
  );

  const [lcNumber, setLcNumber] = useState("");
  const [requests, setRequests] = useState<string[]>([""]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [remarks, setRemarks] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const source: Transaction | undefined = useMemo(
    () =>
      sourceOptions.find(
        (t) => t.details.lcNumber.toLowerCase() === lcNumber.trim().toLowerCase(),
      ),
    [sourceOptions, lcNumber],
  );
  const d = source?.details;

  const filled = requests.map((r) => r.trim()).filter(Boolean);

  const validate = (): string | null => {
    if (!lcNumber.trim()) return "LC number is required";
    if (!filled.length) return "Add at least one amendment request";
    return null;
  };

  const submit = () => {
    const err = validate();
    if (err) return void toast.error(err);

    const id = createRequest({
      requestType: "AMENDMENT",
      module: "IMPORT",
      subDivision: "1.1 MTB Transaction Request",
      actor: session,
      details: {
        ...blankDetails(),
        ...(d ?? {}),
        lcNumber: lcNumber.trim(),
        amendmentRequests: filled,
        attachments: documents,
        lcCopyFileName: documents[0] ?? "",
        remarks,
      },
    });

    setPreviewOpen(false);
    toast.success("Amendment request submitted to FI (MFIS)");
    navigate({ to: "/requests/$id", params: { id } });
  };

  return (
    <div className="space-y-6">
      <Section title="LC reference">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="am-lc">
            LC number<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="am-lc"
            list="am-lcs"
            placeholder="Type or select the LC number"
            value={lcNumber}
            onChange={(e) => setLcNumber(e.target.value)}
          />
          <datalist id="am-lcs">
            {sourceOptions.map((t) => (
              <option key={t.id} value={t.details.lcNumber}>
                {t.details.applicantName}
              </option>
            ))}
          </datalist>
          <p className="text-xs text-muted-foreground">
            {source
              ? `Auto-captured from ${source.referenceNo}.`
              : "Enter an existing LC number to auto-capture its details."}
          </p>
        </div>
      </Section>

      <Section title="Auto-captured LC details">
        <AutoField label="Applicant full name" value={d?.applicantName ?? ""} />
        <AutoField label="Applicant address" value={d?.applicantAddress ?? ""} />
        <AutoField label="Beneficiary full name" value={d?.beneficiaryName ?? ""} />
        <AutoField label="Beneficiary address" value={d?.beneficiaryAddress ?? ""} />
        <AutoField
          label="LC value and currency"
          value={d ? formatMoney(d.currency, d.amount) : ""}
        />
        <AutoField label="Tenor" value={d?.tenorOfDraft ?? ""} />
        <AutoField label="Description of item" value={d?.goodsDescription ?? ""} />
        <AutoField label="Latest date of shipment" value={d?.latestShipmentDate ?? ""} />
        <AutoField label="Date of expiry" value={d?.expiryDate ?? ""} />
        <AutoField label="Place of expiry" value={d?.placeOfExpiry ?? ""} />
        <AutoField label="Port of loading" value={d?.portOfLoading ?? ""} />
        <AutoField label="Port of discharge" value={d?.portOfDischarge ?? ""} />
        <AutoField
          label="Advise through bank"
          value={d?.adviseThroughBank ?? d?.advisingBank ?? ""}
        />
        <AutoField label="Charges" value={d?.chargesBorneBy ?? ""} />
      </Section>

      <Section title="Amendment request" className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Add one line per change requested (value increase/decrease, shipment date,
          expiry date, tenor, goods, ports, etc.).
        </p>
        {requests.map((r, i) => (
          <div key={i} className="flex items-start gap-2">
            <Textarea
              rows={2}
              aria-label={requests.length > 1 ? `Amendment request ${i + 1}` : "Amendment request"}
              placeholder="Amendment request"
              value={r}
              onChange={(e) =>
                setRequests((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={requests.length > 1 ? `Remove amendment request ${i + 1}` : "Remove amendment request"}
              disabled={requests.length === 1}
              onClick={() => setRequests((prev) => prev.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRequests((prev) => [...prev, ""])}
        >
          <Plus className="mr-1 h-4 w-4" /> Add another amendment request
        </Button>
      </Section>

      <Section title="Documents & remarks" className="space-y-5">
        <DocumentsField
          documents={documents}
          onChange={setDocuments}
          hint="Attach the amendment advice, revised PI / contract and any supporting document."
        />
        <div className="space-y-2">
          <Label htmlFor="am-remarks">Remarks</Label>
          <Textarea
            id="am-remarks"
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
            <PreviewRow label="Request" value="Amendment Request" />
            <PreviewRow label="LC number" value={lcNumber} />
            <PreviewRow label="Applicant" value={d?.applicantName ?? "—"} />
            <PreviewRow label="Beneficiary" value={d?.beneficiaryName ?? "—"} />
            <PreviewRow
              label="LC value"
              value={d ? formatMoney(d.currency, d.amount) : "—"}
            />
            <PreviewRow
              label="Amendment requests"
              value={filled.map((r, i) => `${i + 1}. ${r}`).join("\n")}
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
