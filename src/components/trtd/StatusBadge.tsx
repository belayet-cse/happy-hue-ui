import { STATUS_LABEL, type TxnStatus } from "@/lib/trtd/types";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<TxnStatus, string> = {
  SUBMITTED: "border-status-submitted/35 bg-status-submitted/10 text-status-submitted",
  QUERY_RAISED: "border-status-query/40 bg-status-query/12 text-status-query",
  FORWARDED: "border-status-forwarded/35 bg-status-forwarded/10 text-status-forwarded",
  PRICE_OFFERED: "border-status-priced/35 bg-status-priced/10 text-status-priced",
  ACCEPTED: "border-status-accepted/35 bg-status-accepted/10 text-status-accepted",
  REJECTED_BY_RM: "border-status-rejected/35 bg-status-rejected/10 text-status-rejected",
  EXECUTED: "border-status-executed/35 bg-status-executed/10 text-status-executed",
  COMPLETED: "border-status-completed/30 bg-status-completed/10 text-status-completed",
};

export function StatusBadge({
  status,
  className,
}: {
  status: TxnStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        STATUS_STYLE[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}
