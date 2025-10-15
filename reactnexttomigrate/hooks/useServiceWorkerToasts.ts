"use client"

import { useEffect } from "react"
import { useToast } from "./use-toast"

/**
 * Listens for `postMessage` events from the active Service Worker and displays
 * them as toast notifications.  The SW should post messages in the shape:
 *   { type: 'SHOW_TOAST', title?: string, message?: string, variant?: 'success'|'destructive'|'default' }
 */
export function useServiceWorkerToasts(): void {
  const { toast } = useToast()

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    const handler = (event: MessageEvent) => {
      const data = event.data
      if (!data || data.type !== "SHOW_TOAST") return

      toast({
        title: data.title ?? "Notification",
        description: data.message ?? "",
        variant: data.variant ?? "default",
      })
    }

    navigator.serviceWorker.addEventListener("message", handler)
    return () => navigator.serviceWorker.removeEventListener("message", handler)
  }, [toast])
}
