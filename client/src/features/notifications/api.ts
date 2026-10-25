import { del, get, patch, post } from "@/lib/api";
import type { Notification, Paginated } from "@/types";

export type NotificationFilters = { unreadOnly?: boolean; page?: number; pageSize?: number };

export const notificationsApi = {
  list: (filters: NotificationFilters) => get<Paginated<Notification>>("/notifications", filters),
  unreadCount: () => get<number>("/notifications/unread-count"),
  markRead: ({ id }: { id: string }) => patch(`/notifications/${id}/read`),
  markAllRead: () => post("/notifications/read-all"),
  remove: ({ id }: { id: string }) => del(`/notifications/${id}`),
};
