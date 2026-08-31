export type MtbFormKey =
  | "lc-confirmation"
  | "upas-lc"
  | "amendment"
  | "advance-tt"
  | "refinance"
  | "maturity-extension";

export const MTB_FORMS: Record<
  MtbFormKey,
  { code: string; title: string; description: string }
> = {
  "lc-confirmation": {
    code: "1.1.1",
    title: "LC Confirmation Request",
    description: "Add confirmation on an At Sight or Deferred LC.",
  },
  "upas-lc": {
    code: "1.1.2",
    title: "UPAS LC Request",
    description:
      "Confirmation and Discounting, or Post Acceptance Discounting, under a UPAS LC.",
  },
  amendment: {
    code: "1.1.3",
    title: "Amendment Request",
    description:
      "Request amendments on an existing transaction — value, dates, tenor, goods or ports.",
  },
  "advance-tt": {
    code: "1.1.4",
    title: "Advance TT Request",
    description:
      "Advance payment by telegraphic transfer against a sales contract or pro-forma invoice.",
  },
  refinance: {
    code: "1.1.5",
    title: "Refinance MTB Transaction",
    description: "Refinance one or more accepted bills under MTB-issued LCs.",
  },
  "maturity-extension": {
    code: "1.1.6",
    title: "Maturity Extension Request",
    description:
      "Extend the maturity of accepted bills; the new maturity date is auto-calculated.",
  },
};

/** Legacy URL keys kept working after the LC / UPAS split. */
export const MTB_FORM_ALIASES: Record<string, MtbFormKey> = {
  "lc-request": "lc-confirmation",
};
