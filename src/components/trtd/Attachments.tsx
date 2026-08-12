import { useState } from "react";
import { Eye, FileText, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function kindOf(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return "PDF document";
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return "Image";
  if (["msg", "eml"].includes(ext)) return "Email message";
  if (["xls", "xlsx", "csv"].includes(ext)) return "Spreadsheet";
  if (["doc", "docx"].includes(ext)) return "Word document";
  return "File";
}

/** File chips with a viewer dialog (prototype — no real file bytes). */
export function AttachmentList({
  files,
  emptyLabel = "—",
}: {
  files: string[];
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const list = files.filter(Boolean);

  if (list.length === 0) {
    return <span className="text-muted-foreground">{emptyLabel}</span>;
  }

  return (
    <>
      <ul className="space-y-1.5">
        {list.map((f) => (
          <li
            key={f}
            className="flex items-center justify-between gap-3 rounded-sm border border-border bg-surface px-2.5 py-1.5"
          >
            <span className="flex min-w-0 items-center gap-2">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm text-foreground">{f}</span>
              <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">
                {kindOf(f)}
              </span>
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => setOpen(f)}
            >
              <Eye className="size-3.5" /> View
            </Button>
          </li>
        ))}
      </ul>

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Paperclip className="size-4" /> {open}
            </DialogTitle>
            <DialogDescription>
              {open ? kindOf(open) : ""} attached with this request.
            </DialogDescription>
          </DialogHeader>
          <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface text-center">
            <FileText className="size-8 text-muted-foreground" />
            <p className="px-6 text-xs text-muted-foreground">
              Document preview will render here once document storage is wired to the
              backend. This prototype keeps file names only.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
