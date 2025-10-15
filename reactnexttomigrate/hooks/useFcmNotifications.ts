// import { useEffect } from "react";
// import { messaging } from "@/lib/firebase";
// import { getToken, onMessage } from "firebase/messaging";
// import { toast } from "sonner";
// import { getUserId } from "@/lib/api";

// export function useFcmNotifications() {
//     useEffect(() => {
//         if (!messaging) return;

//         // Request permission and get FCM token
//         Notification.requestPermission().then((permission) => {
//             if (permission === "granted") {
//                 getToken(messaging, {
//                     vapidKey: "BFRlMOq7VE6H9XEVKHfYvUzJw536VOs4mGyV2B8z_SdF7VgqqGiCcoTJAdmudmpgR4jXMV3vcOlkMIoAQ-73ZGg"
//                 }).then((currentToken) => {
//                     if (currentToken) {
//                         // Get user ID from local storage or context
//                         const userId = getUserId();
//                         if (userId) {
//                             // Optionally, add device info
//                             const deviceInfo = navigator.userAgent;
//                             fetch("/api/notifications/save-fcm-token", {
//                                 method: "POST",
//                                 headers: { "Content-Type": "application/json" },
//                                 body: JSON.stringify({ userId, fcmToken: currentToken, deviceInfo }),
//                             });
//                         }
//                         // Show a test toast to confirm FCM setup
//                         //toast("FCM setup complete!", { description: "You are ready to receive push notifications." });
//                     }
//                 });
//             }
//         });

//         // Listen for foreground messages
//         const unsubscribe = onMessage(messaging, (payload) => {
//             const { title, body } = payload.notification || {};
//             toast(title, { description: body });
//         });

//         return () => {
//             unsubscribe();
//         };
//     }, []);
// }

export function useFcmNotifications() {
}
