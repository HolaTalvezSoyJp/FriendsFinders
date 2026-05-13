// Polls navigator.geolocation every 30s, pausing when tab is hidden.
// Call startGeolocationPoller(onUpdate) once the user is authenticated.

type OnUpdate = (lat: number, lng: number) => void;

const POLL_INTERVAL_MS = 30_000;

let intervalId: ReturnType<typeof setInterval> | null = null;
let onUpdateCallback: OnUpdate | null = null;

function poll(): void {
  if (typeof navigator === "undefined" || !navigator.geolocation) return;
  if (document.visibilityState === "hidden") return;
  if (!onUpdateCallback) return;

  navigator.geolocation.getCurrentPosition(
    (pos) => onUpdateCallback?.(pos.coords.latitude, pos.coords.longitude),
    (err) => console.warn("[geo] position error:", err.message),
    { enableHighAccuracy: false, timeout: 10_000 }
  );
}

export function startGeolocationPoller(onUpdate: OnUpdate): () => void {
  onUpdateCallback = onUpdate;
  poll();
  intervalId = setInterval(poll, POLL_INTERVAL_MS);

  const handleVisibility = () => {
    if (document.visibilityState === "visible") poll();
  };
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    if (intervalId) clearInterval(intervalId);
    document.removeEventListener("visibilitychange", handleVisibility);
    onUpdateCallback = null;
  };
}
