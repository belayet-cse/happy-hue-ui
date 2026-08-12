import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/trtd/AppShell";
import { PageHeader, useGuard } from "@/components/trtd/Guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { createRequest } from "@/lib/trtd/store";
import type { LcType, RequestDetails, RequestType } from "@/lib/trtd/types";

export const Route = createFileRoute("/requests/new")({
  head: () => ({
    meta: [
      { title: "New request — Trade Transaction Digitalization" },
      {
        name: "description",
        content:
          "Raise an LC confirmation, discounting (UPAS) or combined add-confirmation request to MFIS with full LC particulars.",
      },
      { property: "og:title", content: "New request — Trade Transaction Digitalization" },
      {
        property: "og:description",
        content:
          "Raise an LC confirmation, discounting (UPAS) or combined add-confirmation request to MFIS with full LC particulars.",
      },
    ],
  }),
  component: NewRequestPage,
});

const EMPTY: RequestDetails = {
  lcNumber: "",
  dateOfIssue: "",
  currency: "USD",
  amount: 0,
  lcType: "AT_SIGHT",
  tenorOfDraft: "",
  confirmationInstruction: "REQUIRED",
  applicantName: "",
  applicantAddress: "",
  beneficiaryName: "",
  beneficiaryAddress: "",
  goodsDescription: "",
  hsCode: "",
  countryOfOrigin: "",
  portOfLoading: "",
  portOfDischarge: "",
  latestShipmentDate: "",
  expiryDate: "",
  placeOfExpiry: "",
  advisingBank: "",
  presentationPeriod: "21 days after shipment date but within LC validity",
  chargesBorneBy: "Beneficiary",
  beneficiaryPaymentNote: "",
  remarks: "",
  lcCopyFileName: "",
};

function NewRequestPage() {
  const session = useGuard();
  const navigate = useNavigate();
  const [requestType, setRequestType] = useState<RequestType>("CONFIRMATION");
  const [branch, setBranch] = useState("Principal Branch, Dhaka");
  const [d, setD] = useState<RequestDetails>(EMPTY);

  if (!session) return null;

  if (session.role !== "RM") {
    return (
      <AppShell>
        <PageHeader title="New request" />
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Only an RM can raise a new request. You are signed in as {session.role}.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const set = <K extends keyof RequestDetails>(key: K, value: RequestDetails[K]) =>
    setD((prev) => ({ ...prev, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.lcNumber.trim() || !d.amount || !d.applicantName.trim() || !d.beneficiaryName.trim()) {
      toast.error("LC number, amount, applicant and beneficiary are required");
      return;
    }
    const id = createRequest({ requestType, branch, details: d, actor: session });
    toast.success("Request submitted to MFIS — notification sent");
    navigate({ to: "/requests/$id", params: { id } });
  };

  return (
    <AppShell>
      <PageHeader
        title="New request"
        description="Capture the LC particulars once; MFIS, third bank / OBU and MITS all work from this record."
      />

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Request type</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type of request</Label>
              <Select
                value={requestType}
                onValueChange={(v) => setRequestType(v as RequestType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONFIRMATION">LC Confirmation Request</SelectItem>
                  <SelectItem value="DISCOUNTING">
                    LC Discounting Request (UPAS LC)
                  </SelectItem>
                  <SelectItem value="ADD_CONF_DISC">
                    Add Confirmation &amp; Discounting Request
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch / office</Label>
              <Input id="branch" value={branch} onChange={(e) => setBranch(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">LC particulars</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="LC number" required>
              <Input value={d.lcNumber} onChange={(e) => set("lcNumber", e.target.value)} />
            </Field>
            <Field label="Date of issue">
              <Input
                type="date"
                value={d.dateOfIssue}
                onChange={(e) => set("dateOfIssue", e.target.value)}
              />
            </Field>
            <Field label="Currency">
              <Select value={d.currency} onValueChange={(v) => set("currency", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["USD", "EUR", "GBP", "JPY", "CNY"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="LC amount" required>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={d.amount || ""}
                onChange={(e) => set("amount", Number(e.target.value))}
              />
            </Field>
            <Field label="LC type">
              <Select value={d.lcType} onValueChange={(v) => set("lcType", v as LcType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AT_SIGHT">At Sight</SelectItem>
                  <SelectItem value="DEFERRED">Deferred</SelectItem>
                  <SelectItem value="UPAS">UPAS</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tenor of draft">
              <Input
                placeholder="e.g. 180 days from B/L date"
                value={d.tenorOfDraft}
                onChange={(e) => set("tenorOfDraft", e.target.value)}
              />
            </Field>
            <Field label="Confirmation instruction">
              <Select
                value={d.confirmationInstruction}
                onValueChange={(v) =>
                  set("confirmationInstruction", v as RequestDetails["confirmationInstruction"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REQUIRED">Confirmation required</SelectItem>
                  <SelectItem value="NOT_REQUIRED">Confirmation not required</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Advising / nominated bank">
              <Input
                value={d.advisingBank}
                onChange={(e) => set("advisingBank", e.target.value)}
              />
            </Field>
            <Field label="LC copy attachment">
              <Input
                placeholder="e.g. LC-copy.pdf"
                value={d.lcCopyFileName}
                onChange={(e) => set("lcCopyFileName", e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Parties</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Applicant name" required>
              <Input
                value={d.applicantName}
                onChange={(e) => set("applicantName", e.target.value)}
              />
            </Field>
            <Field label="Beneficiary name" required>
              <Input
                value={d.beneficiaryName}
                onChange={(e) => set("beneficiaryName", e.target.value)}
              />
            </Field>
            <Field label="Applicant address">
              <Textarea
                rows={3}
                value={d.applicantAddress}
                onChange={(e) => set("applicantAddress", e.target.value)}
              />
            </Field>
            <Field label="Beneficiary address">
              <Textarea
                rows={3}
                value={d.beneficiaryAddress}
                onChange={(e) => set("beneficiaryAddress", e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Goods &amp; shipment</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Description of goods" className="sm:col-span-2 lg:col-span-3">
              <Textarea
                rows={2}
                value={d.goodsDescription}
                onChange={(e) => set("goodsDescription", e.target.value)}
              />
            </Field>
            <Field label="HS code">
              <Input value={d.hsCode} onChange={(e) => set("hsCode", e.target.value)} />
            </Field>
            <Field label="Country of origin">
              <Input
                value={d.countryOfOrigin}
                onChange={(e) => set("countryOfOrigin", e.target.value)}
              />
            </Field>
            <Field label="Port of loading">
              <Input
                value={d.portOfLoading}
                onChange={(e) => set("portOfLoading", e.target.value)}
              />
            </Field>
            <Field label="Port of discharge">
              <Input
                value={d.portOfDischarge}
                onChange={(e) => set("portOfDischarge", e.target.value)}
              />
            </Field>
            <Field label="Latest shipment date">
              <Input
                type="date"
                value={d.latestShipmentDate}
                onChange={(e) => set("latestShipmentDate", e.target.value)}
              />
            </Field>
            <Field label="LC expiry date">
              <Input
                type="date"
                value={d.expiryDate}
                onChange={(e) => set("expiryDate", e.target.value)}
              />
            </Field>
            <Field label="Place of expiry">
              <Input
                value={d.placeOfExpiry}
                onChange={(e) => set("placeOfExpiry", e.target.value)}
              />
            </Field>
            <Field label="Presentation period">
              <Input
                value={d.presentationPeriod}
                onChange={(e) => set("presentationPeriod", e.target.value)}
              />
            </Field>
            <Field label="Charges borne by">
              <Input
                value={d.chargesBorneBy}
                onChange={(e) => set("chargesBorneBy", e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notes to MFIS</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Beneficiary payment note">
              <Textarea
                rows={3}
                placeholder="e.g. Beneficiary to receive sight payment; interest borne by applicant."
                value={d.beneficiaryPaymentNote}
                onChange={(e) => set("beneficiaryPaymentNote", e.target.value)}
              />
            </Field>
            <Field label="Remarks">
              <Textarea
                rows={3}
                value={d.remarks}
                onChange={(e) => set("remarks", e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setD(EMPTY)}>
            Clear form
          </Button>
          <Button type="submit">Submit to MFIS</Button>
        </div>
      </form>
    </AppShell>
  );
}

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
