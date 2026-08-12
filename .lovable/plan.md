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

## Screens

- **Login** — username/password form with role selector (RM / MFIS / MITS), styled as the internal portal sign-in. Mock only; session kept in localStorage with a header role/user menu and logout.
- **Dashboard** — role-aware: counts by status, my pending actions, recent activity, notification summary.
- **New Request (RM)** — request-type selector, then a form per type: applicant/beneficiary, LC number & type (At Sight / Deferred), currency & amount, tenor/usance days, expiry & shipment dates, goods description, confirming/discounting bank preference, UPAS-specific fields for discounting, remarks, document attachment placeholders.
- **Transaction List** — searchable/filterable table (type, status, date range, reference no.), role-scoped queues: RM = my requests, MFIS = pending pricing/queries, MITS = accepted-for-execution.
- **Transaction Detail** — the hub. Tabs/sections:
  - Summary of submitted fields
  - Pricing panel (MFIS: confirmation/discount margin, base rate, all-in rate, validity, charges, remarks; revise price on rejection. RM: Accept / Reject with reason)
  - Third Bank / OBU panel (MFIS: mark forwarded to named bank/OBU, then record their response and rate indication)
  - Query handler thread (raise query, reply, resolve; visible to both sides, per transaction)
  - MITS execution panel (execute/complete with reference and remarks)
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
