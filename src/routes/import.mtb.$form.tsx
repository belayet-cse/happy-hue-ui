import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/trtd/AppShell";
import { PageHeader, useGuard } from "@/components/trtd/Guard";
import { AdvanceTtForm } from "@/components/trtd/forms/AdvanceTtForm";
import { AmendmentForm } from "@/components/trtd/forms/AmendmentForm";
import { BillGridForm } from "@/components/trtd/forms/BillGridForm";
import { LcRequestForm } from "@/components/trtd/forms/LcRequestForm";
import { Card, CardContent } from "@/components/ui/card";
import { MTB_FORMS, MTB_FORM_ALIASES, type MtbFormKey } from "@/lib/trtd/forms";

export const Route = createFileRoute("/import/mtb/$form")({
  head: () => ({
    meta: [
      { title: "New MTB Transaction Request — Import" },
      {
        name: "description",
        content:
          "Capture an import transaction request against an MTB-issued LC and submit it to the FI desk for pricing.",
      },
      { property: "og:title", content: "New MTB Transaction Request — Import" },
      {
        property: "og:description",
        content:
          "Capture an import transaction request against an MTB-issued LC and submit it to the FI desk for pricing.",
      },
    ],
  }),
  component: MtbFormPage,
});


function MtbFormPage() {
  const session = useGuard();
  const { form } = useParams({ from: "/import/mtb/$form" });
  if (!session) return null;

  const key = form as MtbFormKey;
  const meta = MTB_FORMS[key];

  if (!meta) {
    return (
      <AppShell>
        <PageHeader title="Unknown request form" />
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            That request form does not exist.{" "}
            <Link
              to="/import/mtb/$form"
              params={{ form: "lc-request" }}
              className="text-primary hover:underline"
            >
              Go to LC Confirmation request
            </Link>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  if (session.role !== "RM") {
    return (
      <AppShell>
        <PageHeader title={meta.title} description={`${meta.code} — MTB Transaction Request`} />
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Only the RM can raise a transaction request. Your desk sees submitted requests
            in the transaction queue.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={meta.title}
        description={`${meta.code} — Import → MTB Transaction Request`}
      />
      {key === "lc-request" ? <LcRequestForm session={session} /> : null}
      {key === "amendment" ? <AmendmentForm session={session} /> : null}
      {key === "advance-tt" ? <AdvanceTtForm session={session} /> : null}
      {key === "refinance" ? <BillGridForm mode="REFINANCE" session={session} /> : null}
      {key === "maturity-extension" ? (
        <BillGridForm mode="MATURITY_EXT" session={session} />
      ) : null}
    </AppShell>
  );
}
