# MTB TradeFI Connect — Module Restructure & Import Phase 1

Aligning the prototype with the final BRD. The app becomes module-driven (Import, Export, Guarantee, Reports & Analytics), and the first build phase delivers all five request forms under **Import → 1.1 MTB Transaction Request**. Frontend only; the existing localStorage mock store continues to back everything.

## 1. Navigation skeleton (all four modules now)

Sidebar restructured into modules with sub-divisions:

```text
Dashboard
Import
  1.1 MTB Transaction Request
  1.2 Other Bank's Transaction Request      (placeholder)
  1.3 Non-Designated Presentation           (placeholder)
Export
  2.1 Local Export Bill Discounting Against LC   (placeholder)
  2.2 Foreign Export Bill Discounting Against LC (placeholder)
Guarantee
  3.1 Guarantee Transaction Request         (placeholder)
  3.2 Guarantee Amendment                   (placeholder)
  3.3 Guarantee Renewal                     (placeholder)
Reports & Analytics                         (placeholder)
Transactions
Notifications
```

Placeholder screens are real routes with proper headings and a "planned for a later phase" panel listing the BRD fields for that screen, so the structure can be walked today.

Supply Chain and Advisory stay out (BRD defers them).

## 2. Import → MTB Transaction Request (this phase)

A landing screen listing the five request forms, each opening its own form. All forms end with **Documents Attached → Preview → Submit** and feed the same RM → MFIS → MITS lifecycle, history tracker, query handler and notifications already built.

**a. LC Confirmation / UPAS LC Request** — rebuild of the current New Request form to the final field list:
transaction type (Add Confirmation Only – At Sight LC / Add Confirmation Only – Deferred LC / Add Confirmation and Discounting / Post Acceptance Discounting [without Confirmation]); auto reference number; applicant and beneficiary full name + address with CIF/name auto-search and "add new" option; LC value, currency and tolerance with multiple amount lines for the same beneficiary plus a total; tenor dropdown with the five BRD sample texts (editable free text for "Other, pls specify"); goods description; country of origin (multi-select); latest date of shipment; date and place of expiry; port of loading (multi); port of discharge (multi); advise through bank; charges (category: confirmation / discounting, both selectable; on account of: applicant / beneficiary / mixed with specify); remarks. Treasury approval excluded.

**b. Amendment** — LC number input, then applicant, beneficiary, LC value, tenor, description, latest shipment date, date/place of expiry, ports, advise through bank and charges auto-captured read-only from the selected LC, plus repeatable free-text "Amendment Request" lines entered by the RM.

**c. Advance TT** — transaction type fixed to Advance TT, auto reference, applicant, beneficiary, currency + amount, tenor (text), description of goods, advise through bank, charges (text), remarks.

**d. Refinance MTB Transaction** and **e. Maturity Extension** — bill-grid forms: LC number (input), applicant name, bill reference (select), bill amount, discounting bank name, maturity date all auto-captured; extension days input; new maturity computed; multiple bill rows per applicant with a total amount row.

## 3. Data model and existing samples

`RequestType` widens to the BRD transaction types and a `module` / `subDivision` tag is added to every transaction. Existing sample deals are migrated into Import → MTB Transaction Request with the new field shape (tolerance, multi-country origin, multi-port, charge category/account-of, advise through bank), so the full RM → MFIS → MITS demo keeps working. New samples added for Amendment, Advance TT and Maturity Extension so each form has a live example.

Transaction list and detail screens gain a module/sub-division filter and render the correct field layout per request type.

## 4. Later phases (planned order)

1. Import 1.2 Other Bank's Transaction Request and 1.3 Non-Designated Presentation
2. Export 2.1 / 2.2 bill discounting grids
3. Guarantee 3.1 / 3.2 / 3.3
4. Reports & Analytics: generate report by applicant, beneficiary, bank, RM, pending, cancelled, LC number, plus Excel export and dashboard exposure views

## Technical notes

- New routes: `/import`, `/import/mtb`, `/import/mtb/$form`, `/import/other-bank`, `/import/non-designated`, `/export`, `/export/$form`, `/guarantee`, `/guarantee/$form`, `/reports`. Each gets its own `head()` metadata.
- Existing `/requests`, `/requests/$id`, `/notifications`, `/dashboard` stay; `/requests/new` redirects to `/import/mtb`.
- Domain types in `src/lib/trtd/types.ts` extended (module, subDivision, transactionType, value lines, charge structure, amendment lines, bill rows); store actions and seed updated in step with them.
- Shared form building blocks factored into `src/components/trtd/` (party lookup, value-line grid, multi-select, bill grid, preview dialog) so the later phases reuse them.
- No backend, no Lovable Cloud; localStorage mock store only.
