import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { AppShell } from "@/components/trtd/AppShell";
import { PageHeader, useGuard } from "@/components/trtd/Guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/trtd/format";
import { markAllRead, markNotificationRead, useTrtdStore } from "@/lib/trtd/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Trade Transaction Digitalization" },
      {
        name: "description",
        content:
          "In-app and email notification trail for every action taken on trade finance transactions.",
      },
      { property: "og:title", content: "Notifications — Trade Transaction Digitalization" },
      {
        property: "og:description",
        content:
          "In-app and email notification trail for every action taken on trade finance transactions.",
      },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const session = useGuard();
  const { notifications } = useTrtdStore();
  if (!session) return null;

  const mine = notifications.filter((n) => n.toRole === session.role);
  const unread = mine.filter((n) => !n.read).length;

  return (
    <AppShell>
      <PageHeader
        title="Notifications"
        description={`${mine.length} notification${mine.length === 1 ? "" : "s"} for ${session.role}${unread ? ` · ${unread} unread` : ""}.`}
        actions={
          unread ? (
            <Button variant="outline" onClick={() => markAllRead(session.role)}>
              Mark all as read
            </Button>
          ) : null
        }
      />

      <div className="space-y-3">
        {mine.map((n) => (
          <Card key={n.id} className={cn(!n.read && "border-primary/40 bg-primary/[0.03]")}>
            <CardContent className="flex flex-wrap items-start gap-4 pt-6">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {!n.read ? <span className="size-2 rounded-full bg-primary" /> : null}
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{formatDateTime(n.at)}</span>
                  <span>Ref: {n.referenceNo}</span>
                  {n.emailTo ? (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="size-3" /> Email sent to {n.emailTo}
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="flex gap-2">
                {!n.read ? (
                  <Button variant="ghost" size="sm" onClick={() => markNotificationRead(n.id)}>
                    Mark read
                  </Button>
                ) : null}
                <Button variant="outline" size="sm" asChild>
                  <Link to="/requests/$id" params={{ id: n.transactionId }}>
                    Open transaction
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {mine.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No notifications yet for your role.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
