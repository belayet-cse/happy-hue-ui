import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/trtd/AppShell";
import { PageHeader, useGuard } from "@/components/trtd/Guard";
import { BillGridForm } from "@/components/trtd/forms/BillGridForm";

export const Route = createFileRoute("/import/other-bank")({
  head: () => ({
    meta: [
      { title: "Other Bank Transaction Request — Import" },
      {
        name: "description",
        content:
          "Refinance request for one or more bills under LCs issued by banks other than MTB.",
      },
      { property: "og:title", content: "Other Bank Transaction Request — Import" },
      {
        property: "og:description",
        content:
          "Refinance request for one or more bills under LCs issued by banks other than MTB.",
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
        title="Other Bank's Transaction Request"
        description="Import → Other Bank's Transaction Request"
      />
      <BillGridForm session={session} mode="OTHER_BANK" />
    </AppShell>
  );
}

