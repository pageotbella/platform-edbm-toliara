import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { type QueryOptions, useApiMutation } from "@/lib/query";
import type { Notification, Paginated } from "@/types";
import { notificationsApi, type NotificationFilters } from "./api";

export const useNotifications = (input: NotificationFilters, options?: QueryOptions<Paginated<Notification>>) =>
  useQuery({
    queryKey: ["notifications", "list", input],
    queryFn: () => notificationsApi.list(input),
    placeholderData: keepPreviousData,
    ...options,
  });

export const useUnreadCount = (options?: QueryOptions<number>) =>
  useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 60_000,
    ...options,
  });

export function useNotificationActions() {
  const affected = [["notifications"]];
  return {
    markRead: useApiMutation(notificationsApi.markRead, affected),
    markAllRead: useApiMutation(notificationsApi.markAllRead, affected),
    remove: useApiMutation(notificationsApi.remove, affected),
  };
}
