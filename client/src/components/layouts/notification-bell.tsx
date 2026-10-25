import { Bell, CheckCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSession } from "@/lib/auth-client";
import { ROLE_HOME, type Role } from "@/config/constants";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNotificationActions, useNotifications, useUnreadCount } from "@/features/notifications/hooks";

// Cloche de notifications (section 26) : compteur de non lues + aperçu des dernières
export function NotificationBell({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const enabled = !!session;
  const unread = useUnreadCount({ enabled });
  const list = useNotifications({ pageSize: 6 }, { enabled: enabled && open });
  const { markRead, markAllRead } = useNotificationActions();
  if (!session) return null;

  const count = unread.data ?? 0;
  const allHref = `${ROLE_HOME[session.user.role as Role] ?? ""}/notifications`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn("relative flex size-9 items-center justify-center rounded-md text-secondary transition hover:bg-muted", className)}
        aria-label={count ? `${count} notification(s) non lue(s)` : "Notifications"}
      >
        <Bell className="size-5" />
        {count > 0 && (
          <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-0 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-semibold">Notifications</p>
          {count > 0 && (
            <button type="button" onClick={() => markAllRead.mutate()} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              <CheckCheck className="size-3.5" /> Tout marquer comme lu
            </button>
          )}
        </div>
        <ul className="max-h-80 overflow-y-auto">
          {list.isPending ? (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">Chargement…</li>
          ) : !list.data?.items.length ? (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">Aucune notification</li>
          ) : list.data.items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => {
                  if (!n.isRead) markRead.mutate({ id: n.id });
                  setOpen(false);
                  if (n.link) navigate(n.link);
                }}
                className={cn("flex w-full gap-3 border-b px-4 py-3 text-left transition last:border-0 hover:bg-muted", !n.isRead && "bg-primary/5")}
              >
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.isRead ? "bg-transparent" : "bg-primary")} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{n.title}</span>
                  {n.content && <span className="line-clamp-2 block text-xs text-muted-foreground">{n.content}</span>}
                  <span className="mt-1 block text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Link to={allHref} onClick={() => setOpen(false)} className="block border-t px-4 py-2.5 text-center text-xs font-semibold text-primary hover:bg-muted">
          Voir toutes les notifications
        </Link>
      </PopoverContent>
    </Popover>
  );
}
