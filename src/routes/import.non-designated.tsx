import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/trtd/AppShell";
import { PageHeader, useGuard } from "@/components/trtd/Guard";
import { PhasePlaceholder } from "@/components/trtd/Placeholder";

export const Route = createFileRoute("/import/non-designated")({
  head: () => ({
    meta: [
      { title: "Non-Designated Presentation — Import" },
      {
        name: "description",
        content:
          "Handling of documents presented at a bank other than the designated bank under an import LC.",
      },
      { property: "og:title", content: "Non-Designated Presentation — Import" },
      {
        property: "og:description",
        content:
          "Handling of documents presented at a bank other than the designated bank under an import LC.",
      },
    ],
  }),
  component: NonDesignatedPage,
});

function NonDesignatedPage() {
  const session = useGuard();
  if (!session) return null;
  return (
    <AppShell>
      <PageHeader
        title="Import → Non-Designated Presentation"
        description="1.3 — documents presented at a bank other than the designated bank."
      />
      <PhasePlaceholder
        phase="a later phase"
        fields={[
          "LC number",
          "Applicant",
          "Beneficiary",
          "Presenting bank",
          "Designated bank",
          "Document set reference",
          "Bill amount & currency",
          "Presentation date",
          "Maturity date",
          "Reason for non-designated presentation",
          "Documents attached",
          "Remarks",
        ]}
      />
    </AppShell>
  );
}
