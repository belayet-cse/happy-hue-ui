import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CURRENCIES, DocumentsField, PreviewRow, Section } from "@/components/trtd/FormKit";
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
import { createRequest, useTrtdStore } from "@/lib/trtd/store";
import { blankDetails, type Session } from "@/lib/trtd/types";

/** LC data auto-captured against the LC number (PPT slide 14). */
interface CapturedLc {
  applicant: string;
  beneficiary: string;
  lcValue: string;
  tenorOfDraft: string;
  descriptionOfItem: string;
  countryOfOrigin: string;
  shipmentFrom: string;
  shipmentTo: string;
  pricingInformation: string;
}

const emptyCapture: CapturedLc = {
  applicant: "",
  beneficiary: "",
  lcValue: "",
  tenorOfDraft: "",
  descriptionOfItem: "",
  countryOfOrigin: "",
  shipmentFrom: "",
  shipmentTo: "",
  pricingInformation: "",
};

/**
 * Import 1.3 — Non-Designated Presentation Transaction Request (PPT slide 14).
 * LC number is keyed in; every LC field is auto-captured. The RM only inputs the
 * finance arrangement request, bill amount, financing tenor and remarks.
 */
export function NonDesignatedForm({ session }: { session: Session }) {
  const navigate = useNavigate();
  const { transactions } = useTrtdStore();

  const [lcNumber, setLcNumber] = useState("");
  const [captured, setCaptured] = useState<CapturedLc>(emptyCapture);
  const [isCaptured, setIsCaptured] = useState(false);

  const [financeRequest, setFinanceRequest] = useState("");
  const [billCurrency, setBillCurrency] = useState("USD");
  const [billAmount, setBillAmount] = useState("");
  const [financingTenor, setFinancingTenor] = useState("");
  const [documents, setDocuments] = useState<string[]>([]);
  const [remarks, setRemarks] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const capture = () => {
    const key = lcNumber.trim().toLowerCase();
    if (!key) return void toast.error("Enter the LC number first");

    const match = transactions.find((t) =>
      t.details.lcNumber.toLowerCase().includes(key),
    );
    if (!match) {
      setIsCaptured(false);
      setCaptured(emptyCapture);
      return void toast.error(
        "No LC found for that number. Check the LC number and try again.",
      );
    }

    const d = match.details;
    setCaptured({
      applicant: [d.applicantName, d.applicantAddress].filter(Boolean).join(", "),
      beneficiary: [d.beneficiaryName, d.beneficiaryAddress].filter(Boolean).join(", "),
      lcValue: formatMoney(d.currency, d.amount),
      tenorOfDraft: d.tenorOfDraft,
      descriptionOfItem: d.goodsDescription,
      countryOfOrigin: d.countryOfOrigin,
      shipmentFrom: d.portOfLoading,
      shipmentTo: d.portOfDischarge,
      pricingInformation:
        match.quotes.at(-1)?.pricingSummary ?? "Not yet priced by the FI desk",
    });
    setBillCurrency(d.currency || "USD");
    setIsCaptured(true);
    toast.success(`LC ${d.lcNumber} details captured`);
  };

  const validate = (): string | null => {
    if (!lcNumber.trim()) return "LC number is required";
    if (!isCaptured) return "Capture the LC details before submitting";
    if (!financeRequest.trim()) return "Request for arrange finance is required";
    if (!Number(billAmount)) return "Bill amount is required";
    if (!financingTenor.trim()) return "Financing tenor is required";
    return null;
  };

  const submit = () => {
    const err = validate();
    if (err) return void toast.error(err);

    const id = createRequest({
      requestType: "NON_DESIGNATED",
      module: "IMPORT",
      subDivision: "Non-Designated Presentation",
      actor: session,
      details: {
        ...blankDetails(),
        lcNumber: lcNumber.trim(),
        currency: billCurrency,
        amount: Number(billAmount),
        applicantName: captured.applicant,
        beneficiaryName: captured.beneficiary,
        tenorOfDraft: captured.tenorOfDraft,
        goodsDescription: captured.descriptionOfItem,
        countryOfOrigin: captured.countryOfOrigin,
        portOfLoading: captured.shipmentFrom,
        portOfDischarge: captured.shipmentTo,
        shipmentFrom: captured.shipmentFrom,
        shipmentTo: captured.shipmentTo,
        pricingInformation: captured.pricingInformation,
        financeArrangementRequest: financeRequest,
        billCurrency,
        billAmount: Number(billAmount),
        financingTenorDays: financingTenor,
        attachments: documents,
        lcCopyFileName: documents[0] ?? "",
        remarks,
      },
    });

    setPreviewOpen(false);
    toast.success("Non-designated presentation submitted to FI — notification sent");
    navigate({ to: "/requests/$id", params: { id } });
  };

  return (
    <div className="space-y-6">
      <Section title="LC number" className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>System transaction reference number</Label>
          <Input value="Auto generated on submit" readOnly disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nd-lc">
            LC number<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="nd-lc"
              value={lcNumber}
              placeholder="Key in the LC number"
              onChange={(e) => {
                setLcNumber(e.target.value);
                setIsCaptured(false);
              }}
            />
            <Button type="button" variant="outline" onClick={capture}>
              <Search className="mr-1 h-4 w-4" /> Capture
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            All LC data below is auto-captured against this LC number.
          </p>
        </div>
      </Section>

      <Section title="Auto-captured LC data">
        <div className="space-y-2 sm:col-span-2">
          <Label>Applicant full name and address</Label>
          <Textarea rows={2} value={captured.applicant} readOnly disabled />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Beneficiary full name and address</Label>
          <Textarea rows={2} value={captured.beneficiary} readOnly disabled />
        </div>
        <div className="space-y-2">
          <Label>LC value and currency</Label>
          <Input value={captured.lcValue} readOnly disabled />
        </div>
        <div className="space-y-2">
          <Label>Tenor of draft</Label>
          <Input value={captured.tenorOfDraft} readOnly disabled />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Description of item</Label>
          <Textarea rows={2} value={captured.descriptionOfItem} readOnly disabled />
        </div>
        <div className="space-y-2">
          <Label>Country of origin</Label>
          <Input value={captured.countryOfOrigin} readOnly disabled />
        </div>
        <div className="space-y-2">
          <Label>Shipment from</Label>
          <Input value={captured.shipmentFrom} readOnly disabled />
        </div>
        <div className="space-y-2">
          <Label>Shipment to</Label>
          <Input value={captured.shipmentTo} readOnly disabled />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Pricing information</Label>
          <Input value={captured.pricingInformation} readOnly disabled />
        </div>
      </Section>

      <Section title="RM input">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nd-fin-req">
            Request for arrange finance<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Textarea
            id="nd-fin-req"
            rows={3}
            placeholder="State the finance arrangement being requested against this presentation"
            value={financeRequest}
            onChange={(e) => setFinanceRequest(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Bill currency</Label>
          <Select value={billCurrency} onValueChange={setBillCurrency}>
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
          <Label htmlFor="nd-bill-amt">
            Bill amount<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="nd-bill-amt"
            type="number"
            min="0"
            step="0.01"
            value={billAmount}
            onChange={(e) => setBillAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nd-fin-tenor">
            Financing tenor<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="nd-fin-tenor"
            placeholder="e.g. 180 days"
            value={financingTenor}
            onChange={(e) => setFinancingTenor(e.target.value)}
          />
        </div>
      </Section>

      <Section title="Documents & remarks" className="space-y-5">
        <DocumentsField
          documents={documents}
          onChange={setDocuments}
          hint="Attach the LC copy, presented document set and covering schedule of the presenting bank."
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
            <PreviewRow label="Applicant" value={captured.applicant} />
            <PreviewRow label="Beneficiary" value={captured.beneficiary} />
            <PreviewRow label="LC value and currency" value={captured.lcValue} />
            <PreviewRow label="Tenor of draft" value={captured.tenorOfDraft} />
            <PreviewRow label="Description of item" value={captured.descriptionOfItem} />
            <PreviewRow label="Country of origin" value={captured.countryOfOrigin} />
            <PreviewRow label="Shipment from" value={captured.shipmentFrom} />
            <PreviewRow label="Shipment to" value={captured.shipmentTo} />
            <PreviewRow label="Pricing information" value={captured.pricingInformation} />
            <PreviewRow label="Request for arrange finance" value={financeRequest} />
            <PreviewRow
              label="Bill amount"
              value={formatMoney(billCurrency, Number(billAmount) || 0)}
            />
            <PreviewRow label="Financing tenor" value={financingTenor} />
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
