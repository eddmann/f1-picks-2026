import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
} from "../lib/push-notifications";
import {
  getVapidPublicKey,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  sendTestNotification,
} from "../lib/api";

type Status =
  | "loading"
  | "unsupported"
  | "denied"
  | "subscribed"
  | "unsubscribed";

export default function NotificationSettings() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!isPushSupported()) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    const existing = await getCurrentSubscription();
    setStatus(existing ? "subscribed" : "unsubscribed");
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleEnable = async () => {
    setBusy(true);
    try {
      const vapidRes = await getVapidPublicKey();
      if (!vapidRes.data) return;

      const subscription = await subscribeToPush(vapidRes.data.vapidPublicKey);
      if (!subscription) {
        // Permission was denied or subscription failed
        if (Notification.permission === "denied") {
          setStatus("denied");
        }
        return;
      }

      const json = subscription.toJSON();
      await subscribeToNotifications({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
        },
      });
      setStatus("subscribed");
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    try {
      const subscription = await getCurrentSubscription();
      if (subscription) {
        await unsubscribeFromNotifications({ endpoint: subscription.endpoint });
        await unsubscribeFromPush();
      }
      setStatus("unsubscribed");
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setTestFeedback(null);
    setBusy(true);
    try {
      const res = await sendTestNotification();
      const feedback = res.data ? "Sent!" : "Failed";
      setTestFeedback(feedback);
      setTimeout(() => setTestFeedback(null), 2000);
    } catch {
      setTestFeedback("Failed");
      setTimeout(() => setTestFeedback(null), 2000);
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading" || status === "unsupported") return null;

  return (
    <div className="bg-carbon border border-asphalt rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-pole/20 rounded-xl flex items-center justify-center">
            {status === "subscribed" ? (
              <Bell className="h-5 w-5 text-pole" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">Push Notifications</h3>
            <p className="text-sm text-gray-500">
              {status === "denied"
                ? "Notifications blocked. Enable in browser settings."
                : status === "subscribed"
                  ? "Enabled on this device"
                  : "Get notified about results and pick deadlines"}
            </p>
          </div>
        </div>

        {status !== "denied" && (
          <div className="flex items-center gap-2">
            {status === "subscribed" && (
              <button
                onClick={handleTest}
                disabled={busy}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 bg-pole/20 text-pole hover:bg-pole/30"
              >
                {testFeedback ?? (busy ? "..." : "Test")}
              </button>
            )}
            <button
              onClick={status === "subscribed" ? handleDisable : handleEnable}
              disabled={busy}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                status === "subscribed"
                  ? "bg-carbon-light text-gray-300 hover:bg-asphalt"
                  : "bg-f1-red text-white hover:bg-f1-red-dark"
              }`}
            >
              {busy ? "..." : status === "subscribed" ? "Disable" : "Enable"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
