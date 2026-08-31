import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/trtd/AppShell";
import { PageHeader, useGuard } from "@/components/trtd/Guard";
import { PhasePlaceholder } from "@/components/trtd/Placeholder";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics — Trade Transaction Digitalization" },
      {
        name: "description",
        content:
          "Portfolio reporting on trade transactions by applicant, beneficiary, bank, RM, status and LC number.",
      },
      {
        property: "og:title",
        content: "Reports & Analytics — Trade Transaction Digitalization",
      },
      {
        property: "og:description",
        content:
          "Portfolio reporting on trade transactions by applicant, beneficiary, bank, RM, status and LC number.",
      },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const session = useGuard();
  if (!session) return null;
  return (
    <AppShell>
      <PageHeader
        title="Reports & Analytics"
        description="Portfolio and workflow reporting across all modules."
      />
      <PhasePlaceholder
        phase="a later phase"
        fields={[
          "Applicant wise",
          "Beneficiary wise",
          "Bank wise",
          "RM wise",
          "Branch wise",
          "Module & request type wise",
          "Pending transactions",
          "Cancelled transactions",
          "LC number wise",
          "Date range",
          "Currency & value bands",
          "Pricing / income analysis",
        ]}
        note="Reports will read the same transaction records produced by the Import, Export and Guarantee modules, with export to Excel/PDF."
      />
    </AppShell>
  );
}
