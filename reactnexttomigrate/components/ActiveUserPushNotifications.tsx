"use client"
import { useAuth } from "@/contexts/auth-context";
import { PushNotificationsClient } from "@/components/PushNotificationsClient";

export function ActiveUserPushNotifications({ vapidPublicKey }: { vapidPublicKey: string }) {
    const { user, sitter, loading } = useAuth();
    // Only render after auth state is loaded and user or sitter is present
    if (loading) return null;
    if (!user && !sitter) return null;
    return <PushNotificationsClient vapidPublicKey={vapidPublicKey} />;
}
