import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/trtd/AppShell";
import { PageHeader, useGuard } from "@/components/trtd/Guard";
import { PhasePlaceholder } from "@/components/trtd/Placeholder";

export const Route = createFileRoute("/import/other-bank")({
  head: () => ({
    meta: [
      { title: "Other Bank Transaction Request — Import" },
      {
        name: "description",
        content:
          "Confirmation, discounting and refinance requests raised against LCs issued by other banks.",
      },
      { property: "og:title", content: "Other Bank Transaction Request — Import" },
      {
        property: "og:description",
        content:
          "Confirmation, discounting and refinance requests raised against LCs issued by other banks.",
      },
    ],
  }),
  component: OtherBankPage,
});

function OtherBankPage() {
  const session = useGuard();
  if (!session) return null;
  return (
    <AppShell>
      <PageHeader
        title="Import → Other Bank Transaction Request"
        description="1.2 — requests against LCs issued by banks other than MTB."
      />
      <PhasePlaceholder
        phase="a later phase"
        fields={[
          "Issuing bank",
          "LC number & date of issue",
          "Applicant",
          "Beneficiary",
          "LC value, currency & tolerance",
          "Tenor",
          "Goods description",
          "Country of origin",
          "Latest date of shipment",
          "Date & place of expiry",
          "Port of loading / discharge",
          "Bill details",
          "Charge category & account of",
          "Documents attached",
          "Remarks",
        ]}
      />
    </AppShell>
  );
}
