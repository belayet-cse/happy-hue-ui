import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/trtd/AppShell";
import { PageHeader, useGuard } from "@/components/trtd/Guard";
import { SubDivisionGrid } from "@/components/trtd/Placeholder";

export const Route = createFileRoute("/export/")({
  head: () => ({
    meta: [
      { title: "Export — Trade Transaction Digitalization" },
      {
        name: "description",
        content:
          "Export module: export LC advising, confirmation, negotiation and discounting requests.",
      },
      { property: "og:title", content: "Export — Trade Transaction Digitalization" },
      {
        property: "og:description",
        content:
          "Export module: export LC advising, confirmation, negotiation and discounting requests.",
      },
    ],
  }),
  component: ExportHome,
});

function ExportHome() {
  const session = useGuard();
  if (!session) return null;
  return (
    <AppShell>
      <PageHeader
        title="Export"
        description="Sub-divisions of the Export module as defined in the BRD."
      />
      <SubDivisionGrid
        items={[
          {
            code: "2.1",
            title: "Export LC Advising & Confirmation",
            description:
              "Advise an export LC and request confirmation from a correspondent bank.",
            to: "/export/$form",
            params: { form: "advising-confirmation" },
            available: false,
          },
          {
            code: "2.2",
            title: "Export Bill Negotiation / Discounting",
            description:
              "Negotiate or discount export bills under LC with pricing from FI.",
            to: "/export/$form",
            params: { form: "negotiation-discounting" },
            available: false,
          },
        ]}
      />
    </AppShell>
  );
}
