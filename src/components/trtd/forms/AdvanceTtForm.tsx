import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CURRENCIES, DocumentsField, PreviewRow, Section } from "@/components/trtd/FormKit";
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

/** Advance TT Request. */
export function AdvanceTtForm({ session }: { session: Session }) {
  const navigate = useNavigate();
  const { transactions } = useTrtdStore();

  const [applicantCif, setApplicantCif] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryAddress, setBeneficiaryAddress] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("");
  const [contractRef, setContractRef] = useState("");
  const [contractDate, setContractDate] = useState("");
  const [goods, setGoods] = useState("");
  const [tenor, setTenor] = useState("");
  const [adviseThroughBank, setAdviseThroughBank] = useState("");
  const [charges, setCharges] = useState("");
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

  const validate = (): string | null => {
    if (!applicantName.trim()) return "Applicant full name is required";
    if (!beneficiaryName.trim()) return "Beneficiary full name is required";
    if (!Number(amount)) return "TT amount is required";
    return null;
  };

  const submit = () => {
    const err = validate();
    if (err) return void toast.error(err);

    const id = createRequest({
      requestType: "ADVANCE_TT",
      module: "IMPORT",
      subDivision: "1.1 MTB Transaction Request",
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
        goodsDescription: goods,
        tenorOfDraft: tenor,
        adviseThroughBank,
        advisingBank: adviseThroughBank,
        chargesBorneBy: charges,
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
      <Section title="Applicant">
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
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="tt-app-addr">Applicant address</Label>
          <Textarea
            id="tt-app-addr"
            rows={2}
            value={applicantAddress}
            onChange={(e) => setApplicantAddress(e.target.value)}
          />
        </div>
      </Section>

      <Section title="Beneficiary">
        <div className="space-y-2">
          <Label htmlFor="tt-ben">
            Beneficiary full name<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="tt-ben"
            list="tt-beneficiaries"
            value={beneficiaryName}
            onChange={(e) => {
              setBeneficiaryName(e.target.value);
              const hit = beneficiaryBook.get(e.target.value);
              if (hit) setBeneficiaryAddress(hit);
            }}
          />
          <datalist id="tt-beneficiaries">
            {Array.from(beneficiaryBook.keys()).map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
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
          <Label htmlFor="tt-tenor">Tenor</Label>
          <Input
            id="tt-tenor"
            placeholder="e.g. Advance payment, 100% before shipment"
            value={tenor}
            onChange={(e) => setTenor(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tt-goods">Description of goods</Label>
          <Input id="tt-goods" value={goods} onChange={(e) => setGoods(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tt-advise">Advise through bank</Label>
          <Input
            id="tt-advise"
            value={adviseThroughBank}
            onChange={(e) => setAdviseThroughBank(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tt-charges">Charges</Label>
          <Input
            id="tt-charges"
            placeholder="e.g. All charges outside Bangladesh on beneficiary account"
            value={charges}
            onChange={(e) => setCharges(e.target.value)}
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
            <PreviewRow label="Applicant" value={applicantName} />
            <PreviewRow label="Beneficiary" value={beneficiaryName} />
            <PreviewRow label="Amount" value={formatMoney(currency, Number(amount) || 0)} />
            <PreviewRow label="Tenor" value={tenor} />
            <PreviewRow label="Description of goods" value={goods} />
            <PreviewRow label="Advise through bank" value={adviseThroughBank} />
            <PreviewRow label="Charges" value={charges} />
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
