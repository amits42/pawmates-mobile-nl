"use client"

import { useState, useCallback, useEffect } from "react"

interface PushNotificationsHook {
  permission: NotificationPermission
  isSupported: boolean
  askPermission: () => void
}

/**
 * Very small helper around the browser Notification API.
 * – Keeps track of current permission
 * – Exposes a method to request permission
 * It **does not** register a service-worker or handle FCM; that work is done by the
 * existing notification components.  This hook’s goal is to ensure the build
 * succeeds and a stable API is available everywhere in the app.
 */
export function usePushNotifications(): PushNotificationsHook {
  const isSupported = typeof window !== "undefined" && "Notification" in window

  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : "default",
  )

  const askPermission = useCallback(() => {
    if (!isSupported) return
    void Notification.requestPermission().then(setPermission)
  }, [isSupported])

  // Keep permission in sync if the user changes it in browser settings
  useEffect(() => {
    if (!isSupported) return
    const handleVisibility = () => setPermission(Notification.permission)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [isSupported])

  return { permission, isSupported, askPermission }
}
