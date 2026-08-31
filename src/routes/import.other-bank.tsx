import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/trtd/AppShell";
import { PageHeader, useGuard } from "@/components/trtd/Guard";
import { LcRequestForm } from "@/components/trtd/forms/LcRequestForm";

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
        title="Import → Other Bank's Transaction Request"
        description="Confirmation or discounting request against an LC issued by a bank other than MTB."
      />
      <LcRequestForm session={session} variant="OTHER_BANK" />
    </AppShell>
  );
}
