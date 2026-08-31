import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/trtd/AppShell";
import { PageHeader, useGuard } from "@/components/trtd/Guard";
import { SubDivisionGrid } from "@/components/trtd/Placeholder";

export const Route = createFileRoute("/guarantee/")({
  head: () => ({
    meta: [
      { title: "Guarantee — Trade Transaction Digitalization" },
      {
        name: "description",
        content:
          "Guarantee module: counter guarantee issuance and advising of guarantees received from abroad.",
      },
      { property: "og:title", content: "Guarantee — Trade Transaction Digitalization" },
      {
        property: "og:description",
        content:
          "Guarantee module: counter guarantee issuance and advising of guarantees received from abroad.",
      },
    ],
  }),
  component: GuaranteeHome,
});

function GuaranteeHome() {
  const session = useGuard();
  if (!session) return null;
  return (
    <AppShell>
      <PageHeader
        title="Guarantee"
        description="Sub-divisions of the Guarantee module as defined in the BRD."
      />
      <SubDivisionGrid
        items={[
          {
            code: "3.1",
            title: "Counter Guarantee Issuance",
            description:
              "Request issuance of a guarantee abroad against MTB's counter guarantee.",
            to: "/guarantee/$form",
            params: { form: "counter-guarantee" },
            available: false,
          },
          {
            code: "3.2",
            title: "Guarantee Advising",
            description: "Advise a guarantee received from a correspondent bank.",
            to: "/guarantee/$form",
            params: { form: "advising" },
            available: false,
          },
        ]}
      />
    </AppShell>
  );
}
