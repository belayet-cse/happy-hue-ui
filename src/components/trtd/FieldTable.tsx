import { cn } from "@/lib/utils";

export function FieldRow({
  label,
  value,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-1 border-b border-border/70 px-4 py-2.5 last:border-b-0 sm:grid-cols-[minmax(11rem,15rem)_1fr] sm:gap-4",
        className,
      )}
    >
      <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="text-sm leading-relaxed break-words whitespace-pre-line text-foreground">
        {value === "" || value === undefined || value === null ? "—" : value}
      </dd>
    </div>
  );
}

export function FieldTable({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      {title ? (
        <div className="border-b border-border bg-surface px-4 py-2.5 text-xs font-semibold tracking-wide text-foreground uppercase">
          {title}
        </div>
      ) : null}
      <dl className="divide-border">{children}</dl>
    </div>
  );
}
