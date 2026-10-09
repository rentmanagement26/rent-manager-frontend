const POLL_INTERVAL_MS = 60_000;

let unreadCount = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export async function refreshUnreadCount() {
  try {
    const response = await fetch("/api/notifications/unread-count", { cache: "no-store" });
    if (!response.ok) return;
    const data: { count: number } = await response.json();
    if (data.count !== unreadCount) {
      unreadCount = data.count;
      emit();
    }
  } catch {
    // A failed poll just keeps the last known count.
  }
}

export function clearUnreadCount() {
  unreadCount = 0;
  emit();
}

export function adjustUnreadCount(delta: number) {
  unreadCount = Math.max(0, unreadCount + delta);
  emit();
}

function refreshIfVisible() {
  if (document.visibilityState === "visible") refreshUnreadCount();
}

export function subscribeToUnreadCount(listener: () => void) {
  listeners.add(listener);

  if (listeners.size === 1) {
    refreshUnreadCount();
    timer = setInterval(refreshIfVisible, POLL_INTERVAL_MS);
    window.addEventListener("focus", refreshIfVisible);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      window.removeEventListener("focus", refreshIfVisible);
    }
  };
}

export function getUnreadCountSnapshot() {
  return unreadCount;
}
