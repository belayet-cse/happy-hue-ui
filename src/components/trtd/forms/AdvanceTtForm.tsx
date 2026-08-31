import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  COUNTRIES,
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
import { createRequest, useTrtdStore } from "@/lib/trtd/store";
import { blankDetails, type Session } from "@/lib/trtd/types";

/** 1.1.3 Advance TT Request. */
export function AdvanceTtForm({ session }: { session: Session }) {
  const navigate = useNavigate();
  const { transactions } = useTrtdStore();

  const [branch, setBranch] = useState("Principal Branch, Dhaka");
  const [applicantCif, setApplicantCif] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryAddress, setBeneficiaryAddress] = useState("");
  const [beneficiaryBank, setBeneficiaryBank] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("");
  const [contractRef, setContractRef] = useState("");
  const [contractDate, setContractDate] = useState("");
  const [goods, setGoods] = useState("");
  const [origin, setOrigin] = useState("");
  const [expectedShipment, setExpectedShipment] = useState("");
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

  const validate = (): string | null => {
    if (!applicantName.trim()) return "Applicant full name is required";
    if (!beneficiaryName.trim()) return "Beneficiary full name is required";
    if (!Number(amount)) return "TT amount is required";
    if (!beneficiaryBank.trim()) return "Beneficiary bank is required";
    return null;
  };

  const submit = () => {
    const err = validate();
    if (err) return void toast.error(err);

    const id = createRequest({
      requestType: "ADVANCE_TT",
      module: "IMPORT",
      subDivision: "1.1 MTB Transaction Request",
      branch,
      actor: session,
      details: {
        ...blankDetails(),
        lcNumber: contractRef,
        dateOfIssue: contractDate,
        currency,
        amount: Number(amount),
        applicantName: applicantName.trim(),
        applicantAddress,
        beneficiaryName: beneficiaryName.trim(),
        beneficiaryAddress,
        advisingBank: beneficiaryBank,
        goodsDescription: goods,
        countryOfOrigin: origin,
        latestShipmentDate: expectedShipment,
        tenorOfDraft: "Advance payment by TT against sales contract / pro-forma invoice",
        attachments: documents,
        lcCopyFileName: documents[0] ?? "",
        remarks,
      },
    });

    setPreviewOpen(false);
    toast.success("Advance TT request submitted to FI (MFIS)");
    navigate({ to: "/requests/$id", params: { id } });
  };

  return (
    <div className="space-y-6">
      <Section title="Applicant & beneficiary">
        <div className="space-y-2">
          <Label htmlFor="tt-branch">Branch / unit</Label>
          <Input
            id="tt-branch"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tt-cif">Applicant CIF</Label>
          <Input
            id="tt-cif"
            value={applicantCif}
            onChange={(e) => setApplicantCif(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tt-app">
            Applicant full name<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="tt-app"
            list="tt-applicants"
            value={applicantName}
            onChange={(e) => {
              setApplicantName(e.target.value);
              const hit = applicantBook.get(e.target.value);
              if (hit) setApplicantAddress(hit);
            }}
          />
          <datalist id="tt-applicants">
            {Array.from(applicantBook.keys()).map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tt-app-addr">Applicant address</Label>
          <Textarea
            id="tt-app-addr"
            rows={2}
            value={applicantAddress}
            onChange={(e) => setApplicantAddress(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tt-ben">
            Beneficiary full name<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="tt-ben"
            value={beneficiaryName}
            onChange={(e) => setBeneficiaryName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tt-ben-addr">Beneficiary address</Label>
          <Textarea
            id="tt-ben-addr"
            rows={2}
            value={beneficiaryAddress}
            onChange={(e) => setBeneficiaryAddress(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="tt-bank">
            Beneficiary bank (with SWIFT)<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="tt-bank"
            placeholder="e.g. Bank of China, Shanghai — BKCHCNBJ300"
            value={beneficiaryBank}
            onChange={(e) => setBeneficiaryBank(e.target.value)}
          />
        </div>
      </Section>

      <Section title="Payment & underlying contract">
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
          <Label htmlFor="tt-amt">
            Advance TT amount<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="tt-amt"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tt-ref">Sales contract / PI reference</Label>
          <Input
            id="tt-ref"
            value={contractRef}
            onChange={(e) => setContractRef(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tt-cdate">Contract / PI date</Label>
          <Input
            id="tt-cdate"
            type="date"
            value={contractDate}
            onChange={(e) => setContractDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tt-goods">Goods description</Label>
          <Input id="tt-goods" value={goods} onChange={(e) => setGoods(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Country of origin</Label>
          <Select value={origin} onValueChange={setOrigin}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tt-ship">Expected shipment date</Label>
          <Input
            id="tt-ship"
            type="date"
            value={expectedShipment}
            onChange={(e) => setExpectedShipment(e.target.value)}
          />
        </div>
      </Section>

      <Section title="Documents & remarks" className="space-y-5">
        <DocumentsField
          documents={documents}
          onChange={setDocuments}
          hint="Attach the pro-forma invoice, sales contract, IMP form and any supporting document."
        />
        <div className="space-y-2">
          <Label htmlFor="tt-remarks">Remarks</Label>
          <Textarea
            id="tt-remarks"
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
            <PreviewRow label="Request" value="Advance TT Request" />
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
            <PreviewRow label="Beneficiary bank" value={beneficiaryBank} />
            <PreviewRow
              label="Advance TT amount"
              value={formatMoney(currency, Number(amount) || 0)}
            />
            <PreviewRow
              label="Contract / PI"
              value={[contractRef, contractDate].filter(Boolean).join(" dated ")}
            />
            <PreviewRow label="Goods description" value={goods} />
            <PreviewRow label="Country of origin" value={origin} />
            <PreviewRow label="Expected shipment date" value={expectedShipment} />
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
