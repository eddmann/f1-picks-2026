export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(
  vapidPublicKey: string,
): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready;

  try {
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
    });
    return subscription;
  } catch {
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready;

  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      return await subscription.unsubscribe();
    }
    return true;
  } catch {
    return false;
  }
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}
