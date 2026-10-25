import { BellOff, CheckCheck, ExternalLink, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useNotificationActions, useNotifications, useUnreadCount } from "../hooks";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Pager } from "@/components/common/pager";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;

// Centre de notifications (section 26), commun aux espaces connectés
export function NotificationsView() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const { data, isPending } = useNotifications({ unreadOnly, page, pageSize: PAGE_SIZE });
  const unread = useUnreadCount();
  const { markRead, markAllRead, remove } = useNotificationActions();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Centre de notifications"
        title="Notifications"
        description="Confirmations, changements de statut et réponses de l'EDBM."
        actions={
          <Button variant="outline" className="h-9" disabled={!unread.data || markAllRead.isPending} onClick={() => markAllRead.mutate()}>
            <CheckCheck /> Tout marquer comme lu
          </Button>
        }
      />
      <div className="flex gap-1.5 rounded-lg border bg-card p-1.5 shadow-card sm:w-fit">
        {[{ v: false, l: "Toutes" }, { v: true, l: `Non lues (${unread.data ?? 0})` }].map(({ v, l }) => (
          <button
            key={l}
            type="button"
            onClick={() => { setUnreadOnly(v); setPage(1); }}
            className={cn("rounded px-3 py-1.5 text-sm font-semibold transition", unreadOnly === v ? "bg-primary text-white" : "text-secondary hover:bg-muted")}
          >
            {l}
          </button>
        ))}
      </div>

      {isPending ? (
        <Skeleton className="h-96 rounded-lg" />
      ) : !data?.items.length ? (
        <EmptyState icon={BellOff} title={unreadOnly ? "Aucune notification non lue" : "Aucune notification"} />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-card">
          <ul>
            {data.items.map((n) => (
              <li key={n.id} className={cn("flex gap-4 border-b px-5 py-4 last:border-0", !n.isRead && "bg-primary/5")}>
                <span className={cn("mt-2 size-2 shrink-0 rounded-full", n.isRead ? "bg-border-strong" : "bg-primary")} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{n.title}</p>
                  {n.content && <p className="text-sm text-muted-foreground">{n.content}</p>}
                  <p className="mt-1 text-xs text-muted-foreground" title={formatDateTime(n.createdAt)}>{timeAgo(n.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-start gap-1">
                  {n.link && (
                    <Link
                      to={n.link}
                      onClick={() => !n.isRead && markRead.mutate({ id: n.id })}
                      className="flex size-8 items-center justify-center rounded text-secondary hover:bg-muted"
                      aria-label="Ouvrir"
                    >
                      <ExternalLink className="size-4" />
                    </Link>
                  )}
                  {!n.isRead && (
                    <button type="button" onClick={() => markRead.mutate({ id: n.id })} className="flex size-8 items-center justify-center rounded text-primary hover:bg-muted" aria-label="Marquer comme lue">
                      <CheckCheck className="size-4" />
                    </button>
                  )}
                  <button type="button" onClick={() => remove.mutate({ id: n.id })} className="flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-red-50 hover:text-red-700" aria-label="Supprimer">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <Pager className="border-t p-3" page={page} pageCount={data.pageCount} total={data.total} pageSize={PAGE_SIZE} label="notifications" onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
