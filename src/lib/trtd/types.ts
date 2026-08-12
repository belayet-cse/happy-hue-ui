export type Role = "RM" | "MFIS" | "MITS";

export type RequestType = "CONFIRMATION" | "DISCOUNTING" | "ADD_CONF_DISC";

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
  DISCOUNTING: "LC Discounting Request (UPAS LC)",
  ADD_CONF_DISC: "Add Confirmation & Discounting Request",
};

export const REQUEST_TYPE_SHORT: Record<RequestType, string> = {
  CONFIRMATION: "Confirmation",
  DISCOUNTING: "Discounting",
  ADD_CONF_DISC: "Add Conf. & Disc.",
};

export const LC_TYPE_LABEL: Record<LcType, string> = {
  AT_SIGHT: "At Sight",
  DEFERRED: "Deferred",
  UPAS: "UPAS",
};

export const STATUS_LABEL: Record<TxnStatus, string> = {
  SUBMITTED: "Submitted to MFIS",
  QUERY_RAISED: "Query Raised",
  FORWARDED: "Forwarded to Third Bank / OBU",
  PRICE_OFFERED: "Price Offered",
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
}

export interface PriceQuote {
  quotedAt: string;
  quotedBy: string;
  revision: number;
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
