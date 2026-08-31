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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/trtd/format";
import { createRequest, useTrtdStore } from "@/lib/trtd/store";
import { blankDetails, type Session } from "@/lib/trtd/types";

/** 1.1.2 Amendment Request — auto-captures the original LC, then lists amendments. */
export function AmendmentForm({ session }: { session: Session }) {
  const navigate = useNavigate();
  const { transactions } = useTrtdStore();

  const sourceOptions = useMemo(
    () => transactions.filter((t) => t.details.lcNumber),
    [transactions],
  );

  const [sourceId, setSourceId] = useState("");
  const source = sourceOptions.find((t) => t.id === sourceId);

  const [branch, setBranch] = useState("Principal Branch, Dhaka");
  const [lcNumber, setLcNumber] = useState("");
  const [amendmentNo, setAmendmentNo] = useState("01");
  const [amendmentDate, setAmendmentDate] = useState("");
  const [requests, setRequests] = useState<string[]>([""]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [remarks, setRemarks] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const pickSource = (id: string) => {
    setSourceId(id);
    const t = sourceOptions.find((x) => x.id === id);
    if (t) {
      setLcNumber(t.details.lcNumber);
      setBranch(t.branch);
    }
  };

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
      branch,
      actor: session,
      details: {
        ...blankDetails(),
        ...(source ? source.details : {}),
        lcNumber: lcNumber.trim(),
        dateOfIssue: source?.details.dateOfIssue ?? "",
        amendmentRequests: filled,
        attachments: documents,
        lcCopyFileName: documents[0] ?? "",
        remarks: [
          `Amendment no. ${amendmentNo}${amendmentDate ? ` dated ${amendmentDate}` : ""}`,
          remarks,
        ]
          .filter(Boolean)
          .join(" — "),
      },
    });

    setPreviewOpen(false);
    toast.success("Amendment request submitted to FI (MFIS)");
    navigate({ to: "/requests/$id", params: { id } });
  };

  return (
    <div className="space-y-6">
      <Section title="Original transaction">
        <div className="space-y-2 sm:col-span-2">
          <Label>Select existing transaction (auto capture)</Label>
          <Select value={sourceId} onValueChange={pickSource}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Search by reference / LC number" />
            </SelectTrigger>
            <SelectContent>
              {sourceOptions.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.referenceNo} — {t.details.lcNumber} — {t.details.applicantName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="am-lc">
            LC number<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input id="am-lc" value={lcNumber} onChange={(e) => setLcNumber(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="am-branch">Branch / unit</Label>
          <Input
            id="am-branch"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
        </div>
        {source ? (
          <dl className="grid gap-x-6 gap-y-1 rounded-md border border-border p-3 text-xs sm:col-span-2 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Applicant</dt>
              <dd>{source.details.applicantName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Beneficiary</dt>
              <dd>{source.details.beneficiaryName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">LC value</dt>
              <dd>{formatMoney(source.details.currency, source.details.amount)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Expiry</dt>
              <dd>{source.details.expiryDate || "—"}</dd>
            </div>
          </dl>
        ) : null}
      </Section>

      <Section title="Amendment details" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="am-no">Amendment number</Label>
            <Input
              id="am-no"
              value={amendmentNo}
              onChange={(e) => setAmendmentNo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="am-date">Amendment date</Label>
            <Input
              id="am-date"
              type="date"
              value={amendmentDate}
              onChange={(e) => setAmendmentDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>
            Amendment request<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            Add one line per change requested (value increase/decrease, shipment date,
            expiry date, tenor, goods, ports, etc.).
          </p>
          {requests.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <Textarea
                rows={2}
                aria-label={`Amendment request ${i + 1}`}
                placeholder="e.g. Latest date of shipment extended from 30-Sep-2026 to 31-Oct-2026"
                value={r}
                onChange={(e) =>
                  setRequests((prev) =>
                    prev.map((x, idx) => (idx === i ? e.target.value : x)),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove amendment request ${i + 1}`}
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
            <Plus className="mr-1 h-4 w-4" /> Add amendment
          </Button>
        </div>

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
            <PreviewRow label="Branch / unit" value={branch} />
            <PreviewRow label="Applicant" value={source?.details.applicantName ?? "—"} />
            <PreviewRow label="Beneficiary" value={source?.details.beneficiaryName ?? "—"} />
            <PreviewRow
              label="Amendment"
              value={`No. ${amendmentNo}${amendmentDate ? ` dated ${amendmentDate}` : ""}`}
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
