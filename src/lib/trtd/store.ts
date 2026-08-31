import { useSyncExternalStore } from "react";
import type {
  AppNotification,
  ForwardRecord,
  ModuleKey,
  PriceQuote,
  RequestDetails,
  RequestType,
  Role,
  Session,
  Transaction,
  TxnStatus,
} from "./types";

import { seedNotifications, seedTransactions } from "./seed";

const STORAGE_KEY = "trtd.store.v1";
const SESSION_KEY = "trtd.session.v1";

interface StoreState {
  transactions: Transaction[];
  notifications: AppNotification[];
  session: Session | null;
  /** false until localStorage has been read on the client */
  ready: boolean;
}

/** Older records (and seed rows) predate the module split — default them to Import. */
function withModule(list: Transaction[]): Transaction[] {
  return list.map((t) => ({
    ...t,
    module: t.module ?? "IMPORT",
    subDivision: t.subDivision ?? "1.1 MTB Transaction Request",
  }));
}

const initialState: StoreState = {
  transactions: withModule(seedTransactions()),
  notifications: seedNotifications(),
  session: null,
  ready: false,
};


let state: StoreState = initialState;
let hydrated = false;
const listeners = new Set<() => void>();

function isBrowser() {
  return typeof window !== "undefined";
}

function hydrate() {
  if (hydrated || !isBrowser()) return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const session = window.localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Omit<StoreState, "session">;
      state = {
        transactions: withModule(parsed.transactions ?? seedTransactions()),
        notifications: parsed.notifications ?? seedNotifications(),
        session: session ? (JSON.parse(session) as Session) : null,
        ready: true,
      };
    } else {
      state = {
        ...initialState,
        session: session ? (JSON.parse(session) as Session) : null,
        ready: true,
      };
      persist();
    }
  } catch {
    state = { ...initialState, ready: true };
  }
}

function persist() {
  if (!isBrowser()) return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ transactions: state.transactions, notifications: state.notifications }),
  );
  if (state.session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(state.session));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

function setState(next: Partial<StoreState>) {
  state = { ...state, ...next };
  persist();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): StoreState {
  hydrate();
  return state;
}

function getServerSnapshot(): StoreState {
  return initialState;
}

export function useTrtdStore(): StoreState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useSession(): Session | null {
  return useTrtdStore().session;
}

export function useStoreReady(): boolean {
  return useTrtdStore().ready;
}

/* ---------- session ---------- */

export function signIn(session: Session) {
  hydrate();
  setState({ session });
}

export function signOut() {
  hydrate();
  setState({ session: null });
}

/* ---------- helpers ---------- */

const uid = () => Math.random().toString(36).slice(2, 10);

function nowIso() {
  return new Date().toISOString();
}

const ROLE_EMAIL: Record<Role, string> = {
  RM: "rm.desk@mtb.com.bd",
  MFIS: "mfis@mtb.com.bd",
  MITS: "mits@mtb.com.bd",
};

function notify(
  txn: Transaction,
  toRole: Role,
  title: string,
  body: string,
): AppNotification {
  return {
    id: uid(),
    at: nowIso(),
    toRole,
    transactionId: txn.id,
    referenceNo: txn.referenceNo,
    title,
    body,
    read: false,
    emailTo: ROLE_EMAIL[toRole],
  };
}

function applyUpdate(
  id: string,
  mutate: (txn: Transaction) => {
    txn: Transaction;
    notifications?: AppNotification[];
  },
) {
  hydrate();
  const notifications: AppNotification[] = [];
  const transactions = state.transactions.map((t) => {
    if (t.id !== id) return t;
    const res = mutate(t);
    if (res.notifications) notifications.push(...res.notifications);
    return res.txn;
  });
  setState({
    transactions,
    notifications: [...notifications, ...state.notifications],
  });
}

function withHistory(
  txn: Transaction,
  actorName: string,
  actorRole: Role,
  action: string,
  statusAfter: TxnStatus,
  remarks?: string,
): Transaction {
  return {
    ...txn,
    status: statusAfter,
    updatedAt: nowIso(),
    history: [
      ...txn.history,
      {
        id: uid(),
        at: nowIso(),
        actorName,
        actorRole,
        action,
        remarks,
        statusAfter,
      },
    ],
  };
}

export function getTransaction(id: string, transactions: Transaction[]) {
  return transactions.find((t) => t.id === id);
}

export function latestQuote(txn: Transaction): PriceQuote | undefined {
  return txn.quotes.length ? txn.quotes[txn.quotes.length - 1] : undefined;
}

export function openQuery(txn: Transaction) {
  return txn.queries.find((q) => !q.resolvedAt);
}

/* ---------- actions ---------- */

export function createRequest(input: {
  requestType: RequestType;
  module?: ModuleKey;
  subDivision?: string;
  branch: string;
  details: RequestDetails;
  actor: Session;
}): string {
  hydrate();
  const seq = 1006 + state.transactions.length;
  const id = `txn-${seq}`;
  const txn: Transaction = {
    id,
    referenceNo: `TRTD-2026-00${seq}`,
    module: input.module ?? "IMPORT",
    subDivision: input.subDivision ?? "1.1 MTB Transaction Request",
    requestType: input.requestType,
    status: "SUBMITTED",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    raisedByName: `${input.actor.name} (RM)`,
    branch: input.branch,
    details: input.details,

    quotes: [],
    forwards: [],
    queries: [],
    history: [
      {
        id: uid(),
        at: nowIso(),
        actorName: `${input.actor.name} (RM)`,
        actorRole: "RM",
        action: "Request submitted to MFIS",
        statusAfter: "SUBMITTED",
      },
    ],
  };
  setState({
    transactions: [txn, ...state.transactions],
    notifications: [
      notify(
        txn,
        "MFIS",
        "New request received",
        `${input.actor.name} submitted ${txn.referenceNo} for ${input.details.currency} ${input.details.amount.toLocaleString()}.`,
      ),
      ...state.notifications,
    ],
  });
  return id;
}

export function raiseQuery(
  id: string,
  actor: Session,
  subject: string,
  message: string,
) {
  applyUpdate(id, (txn) => {
    const updated = withHistory(
      { ...txn, queries: [...txn.queries, {
        id: uid(),
        subject,
        raisedAt: nowIso(),
        raisedByRole: actor.role,
        messages: [
          { id: uid(), at: nowIso(), byName: actor.name, byRole: actor.role, message },
        ],
      }] },
      actor.name,
      actor.role,
      "Query raised",
      "QUERY_RAISED",
      subject,
    );
    return {
      txn: updated,
      notifications: [notify(updated, "RM", "Query raised by MFIS", `${subject} — ${txn.referenceNo}`)],
    };
  });
}

export function replyQuery(
  id: string,
  queryId: string,
  actor: Session,
  message: string,
) {
  applyUpdate(id, (txn) => {
    const queries = txn.queries.map((q) =>
      q.id === queryId
        ? {
            ...q,
            messages: [
              ...q.messages,
              { id: uid(), at: nowIso(), byName: actor.name, byRole: actor.role, message },
            ],
          }
        : q,
    );
    const nextStatus: TxnStatus = actor.role === "RM" ? "SUBMITTED" : "QUERY_RAISED";
    const updated = withHistory(
      { ...txn, queries },
      actor.name,
      actor.role,
      "Query response added",
      nextStatus,
      message,
    );
    return {
      txn: updated,
      notifications: [
        notify(
          updated,
          actor.role === "RM" ? "MFIS" : "RM",
          "Query response received",
          `${txn.referenceNo}: ${message.slice(0, 90)}`,
        ),
      ],
    };
  });
}

export function resolveQuery(id: string, queryId: string, actor: Session) {
  applyUpdate(id, (txn) => {
    const queries = txn.queries.map((q) =>
      q.id === queryId ? { ...q, resolvedAt: nowIso() } : q,
    );
    const updated = withHistory(
      { ...txn, queries },
      actor.name,
      actor.role,
      "Query resolved",
      "SUBMITTED",
    );
    return { txn: updated };
  });
}

export function forwardRequest(
  id: string,
  actor: Session,
  record: Pick<ForwardRecord, "forwardedTo" | "channel" | "note">,
) {
  applyUpdate(id, (txn) => {
    const updated = withHistory(
      {
        ...txn,
        forwards: [...txn.forwards, { ...record, forwardedAt: nowIso() }],
      },
      actor.name,
      actor.role,
      `Forwarded to ${record.forwardedTo}`,
      "FORWARDED",
      record.note,
    );
    return {
      txn: updated,
      notifications: [
        notify(updated, "RM", "Request forwarded", `${txn.referenceNo} forwarded to ${record.forwardedTo}.`),
      ],
    };
  });
}

export function recordForwardResponse(
  id: string,
  actor: Session,
  index: number,
  responseSummary: string,
  indicativePricing: string,
) {
  applyUpdate(id, (txn) => {
    const forwards = txn.forwards.map((f, i) =>
      i === index
        ? { ...f, responseAt: nowIso(), responseSummary, indicativePricing }
        : f,
    );
    const updated = withHistory(
      { ...txn, forwards },
      actor.name,
      actor.role,
      "Third bank / OBU response recorded",
      "FORWARDED",
      responseSummary,
    );
    return { txn: updated };
  });
}

export type QuoteInput = Omit<PriceQuote, "quotedAt" | "quotedBy" | "revision">;

export function offerPrice(id: string, actor: Session, quote: QuoteInput) {
  offerPrices(id, actor, [quote]);
}

/** Offer one or more bank pricing options for the same transaction. */
export function offerPrices(id: string, actor: Session, quotes: QuoteInput[]) {
  applyUpdate(id, (txn) => {
    const base = txn.quotes.length;
    const added = quotes.map((q, i) => ({
      ...q,
      optionNo: q.optionNo ?? i + 1,
      quotedAt: nowIso(),
      quotedBy: actor.name,
      revision: base + i + 1,
    }));
    const label =
      added.length > 1
        ? `Price quote offered — ${added.length} bank options`
        : `Price quote offered (revision ${added[0]!.revision})`;
    const updated = withHistory(
      {
        ...txn,
        quotes: [...txn.quotes, ...added],
        rejectionReason: undefined,
        acceptedQuoteRevision: undefined,
      },
      actor.name,
      actor.role,
      label,
      "PRICE_OFFERED",
      added.map((a) => `${a.bankName || "Bank"}: ${a.pricingSummary || a.financingMargin}`).join(" | "),
    );
    return {
      txn: updated,
      notifications: [
        notify(
          updated,
          "RM",
          base > 0 ? "Revised price offered" : "Price offered",
          `${txn.referenceNo}: pricing is available for your acceptance.`,
        ),
      ],
    };
  });
}

export function acceptPrice(
  id: string,
  actor: Session,
  remarks: string,
  revision?: number,
) {
  applyUpdate(id, (txn) => {
    const chosen = revision ?? latestQuote(txn)?.revision;
    const picked = txn.quotes.find((q) => q.revision === chosen);
    const updated = withHistory(
      { ...txn, acceptedQuoteRevision: chosen },
      actor.name,
      actor.role,
      picked?.bankName
        ? `Price accepted (${picked.bankName}) — routed to MITS for execution`
        : "Price accepted — routed to MITS for execution",
      "ACCEPTED",
      remarks,
    );
    return {
      txn: updated,
      notifications: [
        notify(updated, "MITS", "Transaction ready for execution", `${txn.referenceNo} accepted by RM.`),
        notify(updated, "MFIS", "Price accepted", `${txn.referenceNo} accepted by RM.`),
      ],
    };
  });
}


export function rejectPrice(id: string, actor: Session, reason: string) {
  applyUpdate(id, (txn) => {
    const updated = withHistory(
      { ...txn, rejectionReason: reason },
      actor.name,
      actor.role,
      "Price rejected — returned to MFIS",
      "REJECTED_BY_RM",
      reason,
    );
    return {
      txn: updated,
      notifications: [
        notify(updated, "MFIS", "Price rejected by RM", `${txn.referenceNo}: ${reason}`),
      ],
    };
  });
}

export function executeTransaction(
  id: string,
  actor: Session,
  referenceNo: string,
  remarks: string,
) {
  applyUpdate(id, (txn) => {
    const updated = withHistory(
      {
        ...txn,
        execution: { executedAt: nowIso(), executedBy: actor.name, referenceNo, remarks },
      },
      actor.name,
      actor.role,
      "Transaction executed",
      "EXECUTED",
      referenceNo,
    );
    return {
      txn: updated,
      notifications: [
        notify(updated, "RM", "Transaction executed", `${txn.referenceNo} executed by MITS (${referenceNo}).`),
        notify(updated, "MFIS", "Transaction executed", `${txn.referenceNo} executed by MITS.`),
      ],
    };
  });
}

export function completeTransaction(id: string, actor: Session, remarks: string) {
  applyUpdate(id, (txn) => {
    const updated = withHistory(
      {
        ...txn,
        execution: txn.execution
          ? { ...txn.execution, completedAt: nowIso() }
          : {
              executedAt: nowIso(),
              executedBy: actor.name,
              referenceNo: "",
              remarks,
              completedAt: nowIso(),
            },
      },
      actor.name,
      actor.role,
      "Transaction completed",
      "COMPLETED",
      remarks,
    );
    return {
      txn: updated,
      notifications: [
        notify(updated, "RM", "Transaction completed", `${txn.referenceNo} is now complete.`),
      ],
    };
  });
}

/* ---------- notifications ---------- */

export function markNotificationRead(notificationId: string) {
  hydrate();
  setState({
    notifications: state.notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n,
    ),
  });
}

export function markAllRead(role: Role) {
  hydrate();
  setState({
    notifications: state.notifications.map((n) =>
      n.toRole === role ? { ...n, read: true } : n,
    ),
  });
}

export function resetDemoData() {
  hydrate();
  setState({ transactions: seedTransactions(), notifications: seedNotifications() });
}
