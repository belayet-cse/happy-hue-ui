import { Link } from "@tanstack/react-router";
import { Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Screen scaffolded for a later phase — lists the BRD fields it will capture. */
export function PhasePlaceholder({
  phase,
  fields,
  note,
}: {
  phase: string;
  fields: string[];
  note?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Clock3 className="size-4 text-muted-foreground" />
        <CardTitle className="text-sm">Planned for {phase}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This screen is part of the approved BRD structure and will be built in a later
          phase. The fields below are the capture format defined in the document.
        </p>
        <div className="flex flex-wrap gap-2">
          {fields.map((f) => (
            <Badge key={f} variant="outline" className="font-normal">
              {f}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {note ??
            "Each request will end with Documents Attached → Preview → Submit and follow the same RM → MFIS → MITS lifecycle."}
        </p>
      </CardContent>
    </Card>
  );
}

/** Card grid used by module landing screens. */
export function SubDivisionGrid({
  items,
}: {
  items: {
    code: string;
    title: string;
    description: string;
    to: string;
    params?: Record<string, string>;
    available: boolean;
  }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.code + item.title}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          to={item.to as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          params={item.params as any}
          className="group rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/60 hover:bg-accent/40"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-primary">{item.code}</p>
            {item.available ? null : (
              <Badge variant="outline" className="text-[10px] font-normal">
                Later phase
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm font-medium text-foreground">{item.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
        </Link>
      ))}
    </div>
  );
}
