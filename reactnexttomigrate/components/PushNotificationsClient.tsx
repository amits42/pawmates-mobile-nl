"use client";
import { useFcmNotifications } from "@/hooks/useFcmNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useServiceWorkerToasts } from "@/hooks/useServiceWorkerToasts";

export function PushNotificationsClient({ vapidPublicKey }: { vapidPublicKey: string }) {
  //useFcmNotifications();
  // Leave the old hooks for now as requested
  // usePushNotifications(vapidPublicKey);
  // useServiceWorkerToasts();
  return null;
}
