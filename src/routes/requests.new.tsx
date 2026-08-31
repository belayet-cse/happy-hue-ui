import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — the request forms now live under Import → MTB Transaction Request. */
export const Route = createFileRoute("/requests/new")({
  beforeLoad: () => {
    throw redirect({ to: "/import/mtb/$form", params: { form: "lc-request" } });
  },
});
