// Hard navigation on purpose: /session-expired is a route handler that clears the dead session cookie.
export function goToSessionExpired() {
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/session-expired");
}
