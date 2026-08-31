import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/trtd/AppShell";
import { PageHeader, useGuard } from "@/components/trtd/Guard";
import { SubDivisionGrid } from "@/components/trtd/Placeholder";
import { MTB_FORMS, type MtbFormKey } from "@/lib/trtd/forms";

export const Route = createFileRoute("/import/mtb/")({
  head: () => ({
    meta: [
      { title: "MTB Transaction Request — Import" },
      {
        name: "description",
        content:
          "Raise LC confirmation, UPAS discounting, amendment, advance TT, refinance and maturity extension requests on MTB-issued LCs.",
      },
      { property: "og:title", content: "MTB Transaction Request — Import" },
      {
        property: "og:description",
        content:
          "Raise LC confirmation, UPAS discounting, amendment, advance TT, refinance and maturity extension requests on MTB-issued LCs.",
      },
    ],
  }),
  component: MtbHome,
});

function MtbHome() {
  const session = useGuard();
  if (!session) return null;

  return (
    <AppShell>
      <PageHeader
        title="Import → MTB Transaction Request"
        description="Select the request form. Every request follows the RM → FI (MFIS) → MITS lifecycle with history tracking and notifications."
      />
      <SubDivisionGrid
        items={(Object.keys(MTB_FORMS) as MtbFormKey[]).map((key) => ({
          code: MTB_FORMS[key].code,
          title: MTB_FORMS[key].title,
          description: MTB_FORMS[key].description,
          to: "/import/mtb/$form",
          params: { form: key },
          available: true,
        }))}
      />
    </AppShell>
  );
}
