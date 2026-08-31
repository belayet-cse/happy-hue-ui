import { Plus, Upload, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
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

/** Reusable building blocks shared by every request form. */

export function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className={className ?? "grid gap-4 sm:grid-cols-2"}>{children}</CardContent>
    </Card>
  );
}

export function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-3">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-wrap sm:col-span-2">{value || "—"}</dd>
    </div>
  );
}

export function MultiSelect({
  label,
  options,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value=""
        onValueChange={(v) => {
          if (!values.includes(v)) onChange([...values, v]);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options
            .filter((o) => !values.includes(o))
            .map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {values.length ? (
        <div className="flex flex-wrap gap-2">
          {values.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1">
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={() => onChange(values.filter((x) => x !== v))}
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

/** Documents Attached control — manual entry plus multi-file picker. */
export function DocumentsField({
  documents,
  onChange,
  hint = "Multiple documents can be attached (LC copy, pro-forma invoice, sales contract, etc.).",
}: {
  documents: string[];
  onChange: (next: string[]) => void;
  hint?: string;
}) {
  const [docInput, setDocInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const add = () => {
    if (docInput.trim()) {
      onChange([...documents, docInput.trim()]);
      setDocInput("");
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="doc-input">Documents attached</Label>
      <div className="flex flex-wrap gap-2">
        <Input
          id="doc-input"
          className="min-w-56 flex-1"
          placeholder="e.g. Pro-forma-invoice.pdf"
          value={docInput}
          onChange={(e) => setDocInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="h-4 w-4" /> Attach
        </Button>
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4" /> Upload files
        </Button>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? []).map((f) => f.name);
            if (picked.length) onChange([...documents, ...picked]);
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {documents.length ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {documents.map((doc, i) => (
            <Badge key={`${doc}-${i}`} variant="secondary" className="gap-1">
              {doc}
              <button
                type="button"
                aria-label={`Remove ${doc}`}
                onClick={() => onChange(documents.filter((_, idx) => idx !== i))}
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

export const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY"];

export const TOLERANCES = ["Nil", "+/- 5%", "+/- 10%", "+ 5%", "- 5%"];

export const COUNTRIES = [
  "China",
  "India",
  "Indonesia",
  "Japan",
  "Korea",
  "Malaysia",
  "Saudi Arabia",
  "Singapore",
  "Thailand",
  "UAE",
  "Vietnam",
];

export const LOADING_PORTS = [
  "Shanghai, China",
  "Ningbo, China",
  "Port Klang, Malaysia",
  "Singapore",
  "Jebel Ali, UAE",
  "Nhava Sheva, India",
  "Busan, Korea",
];

export const DISCHARGE_PORTS = [
  "Chittagong Sea Port, Bangladesh",
  "Mongla Sea Port, Bangladesh",
  "Pangaon ICT, Bangladesh",
  "Benapole Land Port, Bangladesh",
  "Dhaka ICD (Kamalapur), Bangladesh",
];

export const ADVISING_BANKS = [
  "Standard Chartered Bank, Dhaka",
  "Commercial Bank of Ceylon PLC, Dhaka",
  "HSBC, Dhaka",
  "Citibank N.A., Dhaka",
  "Woori Bank, Dhaka",
];
