export type Role = "RM" | "MFIS" | "MITS";

/** Top-level platform modules (BRD front page). Supply Chain & Advisory deferred. */
export type ModuleKey = "IMPORT" | "EXPORT" | "GUARANTEE";

export const MODULE_LABEL: Record<ModuleKey, string> = {
  IMPORT: "Import",
  EXPORT: "Export",
  GUARANTEE: "Guarantee",
};

export type RequestType =
  | "CONFIRMATION"
  | "DISCOUNTING"
  | "ADD_CONF_DISC"
  | "AMENDMENT"
  | "ADVANCE_TT"
  | "REFINANCE"
  | "MATURITY_EXT";

export type TxnStatus =
  | "SUBMITTED"
  | "QUERY_RAISED"
  | "FORWARDED"
  | "PRICE_OFFERED"
  | "ACCEPTED"
  | "REJECTED_BY_RM"
  | "EXECUTED"
  | "COMPLETED";

export type LcType = "AT_SIGHT" | "DEFERRED" | "UPAS";

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  CONFIRMATION: "LC Confirmation Request",
  DISCOUNTING: "Post Acceptance Discounting (UPAS LC)",
  ADD_CONF_DISC: "Add Confirmation & Discounting Request",
  AMENDMENT: "Amendment Request",
  ADVANCE_TT: "Advance TT Request",
  REFINANCE: "Refinance MTB Transaction",
  MATURITY_EXT: "Maturity Extension Request",
};

export const REQUEST_TYPE_SHORT: Record<RequestType, string> = {
  CONFIRMATION: "Confirmation",
  DISCOUNTING: "Discounting",
  ADD_CONF_DISC: "Add Conf. & Disc.",
  AMENDMENT: "Amendment",
  ADVANCE_TT: "Advance TT",
  REFINANCE: "Refinance",
  MATURITY_EXT: "Maturity Extension",
};

export const LC_TYPE_LABEL: Record<LcType, string> = {
  AT_SIGHT: "At Sight",
  DEFERRED: "Deferred",
  UPAS: "UPAS",
};

export const STATUS_LABEL: Record<TxnStatus, string> = {
  SUBMITTED: "Pending at FI counter",
  QUERY_RAISED: "Query Raised",
  FORWARDED: "Under FI processing",
  PRICE_OFFERED: "Pending for RM response",
  ACCEPTED: "Accepted — with MITS",
  REJECTED_BY_RM: "Rejected by RM",
  EXECUTED: "Executed by MITS",
  COMPLETED: "Completed",
};


export interface RequestDetails {
  lcNumber: string;
  dateOfIssue: string;
  currency: string;
  amount: number;
  /** LC value tolerance, e.g. "+/- 5%" */
  tolerance?: string | undefined;
  /** Expected payment date (not before LC expiry) */
  expectedPaymentDate?: string | undefined;
  /** Extra attached document names beyond the LC copy */
  attachments?: string[] | undefined;

  lcType: LcType;
  tenorOfDraft: string;
  confirmationInstruction: "REQUIRED" | "NOT_REQUIRED";
  applicantName: string;
  applicantAddress: string;
  beneficiaryName: string;
  beneficiaryAddress: string;
  goodsDescription: string;
  hsCode: string;
  countryOfOrigin: string;
  portOfLoading: string;
  portOfDischarge: string;
  latestShipmentDate: string;
  expiryDate: string;
  placeOfExpiry: string;
  advisingBank: string;
  presentationPeriod: string;
  chargesBorneBy: string;
  beneficiaryPaymentNote: string;
  remarks: string;
  lcCopyFileName: string;

  /** BRD 15A — charge category: Confirmation / Discounting (both can apply) */
  chargeCategories?: string[] | undefined;
  /** BRD 15B — charges on account of: Applicant / Beneficiary / Mixed (specify) */
  chargesOnAccountOf?: string | undefined;
  /** BRD 14 — advise through bank */
  adviseThroughBank?: string | undefined;
  /** Amendment request lines entered by RM */
  amendmentRequests?: string[] | undefined;
  /** Bill rows for Refinance / Maturity Extension / other-bank requests */
  bills?: BillRow[] | undefined;
}

/** A single bill line for refinance / maturity-extension style requests. */
export interface BillRow {
  lcNumber: string;
  applicantName: string;
  billReference: string;
  currency: string;
  billAmount: number;
  discountingBankName: string;
  maturityDate: string;
  extensionDays: number;
  newMaturityDate: string;
}

/** All-empty request details so each form only fills the fields it owns. */
export function blankDetails(): RequestDetails {
  return {
    lcNumber: "",
    dateOfIssue: "",
    currency: "USD",
    amount: 0,
    lcType: "AT_SIGHT",
    tenorOfDraft: "",
    confirmationInstruction: "NOT_REQUIRED",
    applicantName: "",
    applicantAddress: "",
    beneficiaryName: "",
    beneficiaryAddress: "",
    goodsDescription: "",
    hsCode: "",
    countryOfOrigin: "",
    portOfLoading: "",
    portOfDischarge: "",
    latestShipmentDate: "",
    expiryDate: "",
    placeOfExpiry: "",
    advisingBank: "",
    presentationPeriod: "",
    chargesBorneBy: "",
    beneficiaryPaymentNote: "",
    remarks: "",
    lcCopyFileName: "",
  };
}



export interface PriceQuote {
  quotedAt: string;
  quotedBy: string;
  revision: number;
  /** Option number when several bank prices are offered for the same transaction */
  optionNo?: number | undefined;
  /** Pricing bank, e.g. "KBC BANK BELGIUM" */
  bankName?: string | undefined;
  /** Headline pricing line, e.g. "SOFR PLUS 3.50%" */
  pricingSummary?: string | undefined;
  /** Price quote to MITS same as RM */
  quoteToMitsSameAsRm?: boolean | undefined;
  /** Third bank pricing mail attached by MFIS — visible to MFIS only */
  thirdBankMailFiles?: string[] | undefined;
  confirmationRate: string;
  confirmationBasis: string;
  confirmationMinCharge: string;
  financingBaseRate: string;
  financingMargin: string;
  financingBasis: string;
  financingMinCharge: string;
  issuingToBank: string;
  maxDoorToDoorTenorDays: string;
  maxSingleLcValue: string;
  reimbursementBank: string;
  includeInMt700: boolean;
  subjectToCreditApproval: boolean;
  validityDays: string;
  validUntil: string;
  additionalConditions: string;
}


export interface ForwardRecord {
  forwardedAt: string;
  forwardedTo: string;
  channel: "THIRD_BANK" | "OBU";
  note: string;
  responseAt?: string | undefined;
  responseSummary?: string | undefined;
  indicativePricing?: string | undefined;
}

export interface QueryMessage {
  id: string;
  at: string;
  byName: string;
  byRole: Role;
  message: string;
}

export interface QueryThread {
  id: string;
  subject: string;
  raisedAt: string;
  raisedByRole: Role;
  resolvedAt?: string | undefined;
  messages: QueryMessage[];
}

export interface HistoryEntry {
  id: string;
  at: string;
  actorName: string;
  actorRole: Role | "SYSTEM";
  action: string;
  remarks?: string | undefined;
  statusAfter?: TxnStatus | undefined;
}

export interface Execution {
  executedAt: string;
  executedBy: string;
  referenceNo: string;
  remarks: string;
  completedAt?: string | undefined;
}

export interface Transaction {
  id: string;
  referenceNo: string;
  /** Platform module this request belongs to (defaults to Import) */
  module?: ModuleKey | undefined;
  /** Sub-division label, e.g. "1.1 MTB Transaction Request" */
  subDivision?: string | undefined;
  requestType: RequestType;
  status: TxnStatus;

  createdAt: string;
  updatedAt: string;
  raisedByName: string;
  branch: string;
  details: RequestDetails;
  quotes: PriceQuote[];
  forwards: ForwardRecord[];
  queries: QueryThread[];
  history: HistoryEntry[];
  execution?: Execution | undefined;
  rejectionReason?: string | undefined;
  /** Revision of the quote the RM accepted */
  acceptedQuoteRevision?: number | undefined;
}


export interface AppNotification {
  id: string;
  at: string;
  toRole: Role;
  transactionId: string;
  referenceNo: string;
  title: string;
  body: string;
  read: boolean;
  emailTo?: string | undefined;
}

export interface Session {
  name: string;
  role: Role;
}
