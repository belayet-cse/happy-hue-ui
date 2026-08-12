# Trade Transaction Digitalization — Frontend Flow (Phase 1)

Frontend-only React build of the RM → MFIS → MITS lifecycle for three request types. No backend work; all data lives in a browser mock store so the whole flow can be walked end to end and survives refresh.

## Scope

Three request types only:
1. LC Confirmation Request (LC type: At Sight / Deferred)
2. LC Discounting Request (UPAS LC)
3. Add Confirmation and Discounting Request

Three roles: RM, MFIS, MITS.

## Lifecycle

```text
RM creates request
        v
   [SUBMITTED]  -> MFIS inbox
        v
MFIS: raise query -> [QUERY_RAISED] -> RM responds -> back to MFIS
MFIS: forward to Third Bank / OBU -> [FORWARDED] -> MFIS records response
MFIS: enter pricing -> [PRICE_OFFERED]
        v
RM: Accept -> [ACCEPTED] -> MITS inbox -> MITS executes -> [EXECUTED] / [COMPLETED]
RM: Reject -> [REJECTED_BY_RM] -> back to MFIS for reprocessing / revised price
```

Every status change, query, pricing revision and execution step is appended to a per-transaction history tracker (actor, role, action, timestamp, remarks) and fires an in-app notification.

## Request form fields (from the sample correspondence)

The RM request form mirrors the tabular email exactly, so the system output reads like the current mail:

LC number, date of issue, LC amount + currency, LC type (At Sight / Deferred / UPAS), tenor of draft (free text, e.g. "180 days from B/L date, acceptance & negotiation" with supplier's-credit vs buyer's-credit/UPAS split), confirmation instruction (Required / Not Required), applicant name + address, beneficiary name + address, commodity / description of goods (with HS code, quantity, unit price), country of origin, port of loading, port of discharge / destination, latest date of shipment, date & place of expiry, LC advising bank, period for presentation of documents, charges to be borne by (Applicant's / Beneficiary's account), beneficiary payment note, remarks, LC copy attachment placeholder.

## Price quote fields (MFIS side)

Structured version of the "we would be able to accommodate the deal" reply:

- Confirmation pricing: % p.a. on LC value (incl. tolerance), from-date basis, minimum charge (e.g. USD 500)
- Financing/discounting pricing: base rate (SOFR/Term SOFR/other) + margin % p.a. on draft value, from financing date till payment maturity, minimum charge
- Conditions block: LC to be issued to / documents presented at (bank & branch), max total door-to-door tenor (days), max single LC / document value cap, reimbursement bank, "include pricing in relevant MT 700 field" flag
- Quote validity (calendar days, with computed expiry date) and the note that financing must complete within validity or the rate is re-determined
- Free-text additional conditions, plus "subject to internal credit approval and due diligence" flag

The accepted quote renders as a printable/copyable summary in the same layout as the current email, so nothing is lost versus today's process.

## Screens

- **Login** — username/password form with role selector (RM / MFIS / MITS), styled as the internal portal sign-in. Mock only; session kept in localStorage with a header role/user menu and logout.
- **Dashboard** — role-aware: counts by status, my pending actions, recent activity, notification summary.
- **New Request (RM)** — request-type selector, then the field set above, pre-labelled per type (Confirmation only / Discounting only / Add Confirmation & Discounting).
- **Transaction List** — searchable/filterable table (type, status, date range, reference no., amount), role-scoped queues: RM = my requests, MFIS = pending pricing/queries, MITS = accepted-for-execution.
- **Transaction Detail** — the hub. Tabs/sections:
  - Request summary in the email's tabular layout
  - Pricing panel (MFIS: enter/revise the quote above. RM: Accept / Reject with reason, with validity countdown)
  - Third Bank / OBU panel (MFIS: mark forwarded to named bank/OBU, then record their response and indicative pricing)
  - Query handler thread (raise query, reply, resolve; per transaction, both sides)
  - MITS execution panel (LC issuance / acceptance reference, execution remarks, complete)
  - History tracker timeline (chronological, immutable)
- **Notifications** — bell with unread count, dropdown list, toast on new events, full notifications page. Email dispatch is represented as an "Email notification sent to X" entry in history (no sending, frontend only).


## Design direction

Institutional banking UI: MTB-leaning deep green/navy primary with amber accent, dense data tables, clear status chips per state, sidebar navigation, light theme. All colors as semantic tokens in `src/styles.css` — no hardcoded color utilities.

## Technical notes

- TanStack Start file routes: `/` (redirects to login or dashboard), `/login`, `/dashboard`, `/requests/new`, `/requests`, `/requests/$id`, `/notifications`. Each content route gets its own `head()` metadata.
- Mock domain layer in `src/lib/trtd/`: types + status enum, localStorage-backed store with seeded demo transactions across every status, action functions (submit, raiseQuery, replyQuery, forward, recordForwardResponse, setPrice, accept, reject, execute), history appender, notification generator. Named to match the eventual TRTD backend contract so the ASP.NET/Oracle wiring is a drop-in later.
- Role-based route guard reading the mock session; unauthorized actions hidden, not just disabled.
- shadcn components (table, dialog, tabs, form, badge, sonner toasts) with `<Toaster />` mounted in `__root.tsx`.
- No Lovable Cloud, no server functions, no database in this phase.

## Out of scope for now

Export/Guarantee modules, supply chain, advisory, bulk upload, reports & analytics, Treasury role, real authentication, real email.
