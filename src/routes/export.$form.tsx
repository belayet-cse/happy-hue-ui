import { createFileRoute, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/trtd/AppShell";
import { PageHeader, useGuard } from "@/components/trtd/Guard";
import { PhasePlaceholder } from "@/components/trtd/Placeholder";

export const Route = createFileRoute("/export/$form")({
  head: () => ({
    meta: [
      { title: "Export Request — Trade Transaction Digitalization" },
      {
        name: "description",
        content: "Export request capture form, scaffolded for a later delivery phase.",
      },
      { property: "og:title", content: "Export Request — Trade Transaction Digitalization" },
      {
        property: "og:description",
        content: "Export request capture form, scaffolded for a later delivery phase.",
      },
    ],
  }),
  component: ExportFormPage,
});

const TITLES: Record<string, string> = {
  "advising-confirmation": "Export LC Advising & Confirmation",
  "negotiation-discounting": "Export Bill Negotiation / Discounting",
};

function ExportFormPage() {
  const session = useGuard();
  const { form } = useParams({ from: "/export/$form" });
  if (!session) return null;
  return (
    <AppShell>
      <PageHeader
        title={TITLES[form] ?? "Export Request"}
        description="Export module request form."
      />
      <PhasePlaceholder
        phase="a later phase"
        fields={[
          "Exporter (beneficiary) & CIF",
          "Applicant / importer",
          "Issuing bank",
          "LC number & date of issue",
          "LC value, currency & tolerance",
          "Tenor",
          "Goods description",
          "Shipment & expiry dates",
          "Port of loading / discharge",
          "Confirming bank preference",
          "Charge category & account of",
          "Documents attached",
          "Remarks",
        ]}
      />
    </AppShell>
  );
}
