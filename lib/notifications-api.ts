import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError, extractErrorMessage } from "@/lib/api-error";
import type { NotificationItem } from "@/lib/types";

async function notificationsRequest(path: string, token: string, init?: RequestInit): Promise<Response> {
  const response = await backendFetch(`/api/v1/notifications${path}`, token, init);
  if (response.status === 401) {
    throw new SessionExpiredError();
  }
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response;
}

export async function getMyNotifications(token: string, unreadOnly = false): Promise<NotificationItem[]> {
  const response = await notificationsRequest(unreadOnly ? "?unreadOnly=true" : "", token);
  return response.json();
}

export async function getUnreadNotificationCount(token: string): Promise<number> {
  const response = await notificationsRequest("/unread-count", token);
  const data: { count: number } = await response.json();
  return data.count;
}

export async function markNotificationRead(token: string, id: number): Promise<void> {
  await notificationsRequest(`/${id}/read`, token, { method: "POST" });
}
