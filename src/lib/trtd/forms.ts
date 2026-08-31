export type MtbFormKey =
  | "lc-request"
  | "amendment"
  | "advance-tt"
  | "refinance"
  | "maturity-extension";

export const MTB_FORMS: Record<
  MtbFormKey,
  { code: string; title: string; description: string }
> = {
  "lc-request": {
    code: "1.1.1",
    title: "LC Confirmation / UPAS Confirmation & Discounting",
    description:
      "Add confirmation (at sight or deferred), add confirmation with discounting, or post-acceptance discounting.",
  },
  amendment: {
    code: "1.1.2",
    title: "Amendment Request",
    description:
      "Request amendments on an existing transaction — value, dates, tenor, goods or ports.",
  },
  "advance-tt": {
    code: "1.1.3",
    title: "Advance TT Request",
    description:
      "Advance payment by telegraphic transfer against a sales contract or pro-forma invoice.",
  },
  refinance: {
    code: "1.1.4",
    title: "Refinance MTB Transaction",
    description: "Refinance one or more accepted bills under MTB-issued LCs.",
  },
  "maturity-extension": {
    code: "1.1.5",
    title: "Maturity Extension Request",
    description:
      "Extend the maturity of accepted bills; the new maturity date is auto-calculated.",
  },
};
