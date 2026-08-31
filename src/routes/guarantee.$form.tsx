import { createFileRoute, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/trtd/AppShell";
import { PageHeader, useGuard } from "@/components/trtd/Guard";
import { PhasePlaceholder } from "@/components/trtd/Placeholder";

export const Route = createFileRoute("/guarantee/$form")({
  head: () => ({
    meta: [
      { title: "Guarantee Request — Trade Transaction Digitalization" },
      {
        name: "description",
        content: "Guarantee request capture form, scaffolded for a later delivery phase.",
      },
      {
        property: "og:title",
        content: "Guarantee Request — Trade Transaction Digitalization",
      },
      {
        property: "og:description",
        content: "Guarantee request capture form, scaffolded for a later delivery phase.",
      },
    ],
  }),
  component: GuaranteeFormPage,
});

const TITLES: Record<string, string> = {
  "counter-guarantee": "Counter Guarantee Issuance",
  advising: "Guarantee Advising",
};

function GuaranteeFormPage() {
  const session = useGuard();
  const { form } = useParams({ from: "/guarantee/$form" });
  if (!session) return null;
  return (
    <AppShell>
      <PageHeader
        title={TITLES[form] ?? "Guarantee Request"}
        description="Guarantee module request form."
      />
      <PhasePlaceholder
        phase="a later phase"
        fields={[
          "Applicant & CIF",
          "Beneficiary abroad",
          "Guarantee type (bid / performance / advance payment)",
          "Guarantee value & currency",
          "Issuing bank abroad",
          "Effective date & expiry date",
          "Claim expiry",
          "Underlying contract reference",
          "Guarantee text / wording",
          "Charge category & account of",
          "Documents attached",
          "Remarks",
        ]}
      />
    </AppShell>
  );
}
