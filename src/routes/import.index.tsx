import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/trtd/AppShell";
import { PageHeader, useGuard } from "@/components/trtd/Guard";
import { SubDivisionGrid } from "@/components/trtd/Placeholder";

export const Route = createFileRoute("/import/")({
  head: () => ({
    meta: [
      { title: "Import — Trade Transaction Digitalization" },
      {
        name: "description",
        content:
          "Import module: MTB transaction requests, other bank transaction requests and non-designated presentations.",
      },
      { property: "og:title", content: "Import — Trade Transaction Digitalization" },
      {
        property: "og:description",
        content:
          "Import module: MTB transaction requests, other bank transaction requests and non-designated presentations.",
      },
    ],
  }),
  component: ImportHome,
});

function ImportHome() {
  const session = useGuard();
  if (!session) return null;

  return (
    <AppShell>
      <PageHeader
        title="Import"
        description="Sub-divisions of the Import module as defined in the BRD."
      />
      <SubDivisionGrid
        items={[
          {
            code: "1.1",
            title: "MTB Transaction Request",
            description:
              "LC confirmation, UPAS confirmation & discounting, amendment, advance TT, refinance and maturity extension.",
            to: "/import/mtb",
            available: true,
          },
          {
            code: "1.2",
            title: "Other Bank Transaction Request",
            description:
              "Confirmation, discounting and refinance requests against LCs issued by other banks.",
            to: "/import/other-bank",
            available: false,
          },
          {
            code: "1.3",
            title: "Non-Designated Presentation",
            description:
              "Documents presented at a bank other than the designated bank, routed for FI handling.",
            to: "/import/non-designated",
            available: false,
          },
        ]}
      />
    </AppShell>
  );
}
