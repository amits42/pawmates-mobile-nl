// // [START initialize_firebase_in_sw]
// importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// firebase.initializeApp({
//     apiKey: "AIzaSyB3fPxtEGMU9DnyJAkG-hYUkBezOrV4pHk",
//     authDomain: "pawmates-53cb4.firebaseapp.com",
//     projectId: "pawmates-53cb4",
//     storageBucket: "pawmates-53cb4.firebasestorage.app",
//     messagingSenderId: "287567425574",
//     appId: "1:287567425574:web:c9c51bc3771e9deec4b6e7",
//     measurementId: "G-X08SW1GCTM",
// });

// const messaging = firebase.messaging();

// messaging.onBackgroundMessage(function (payload) {
//     const { title, body } = payload.notification || {};
//     self.registration.showNotification(title, {
//         body,
//         icon: '/placeholder-logo.png',
//         badge: '/placeholder-logo.png',
//     });

//     // Post message to all open clients for in-app toast
//     self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clients) {
//         clients.forEach(function (client) {
//             client.postMessage({
//                 type: 'PUSH_NOTIFICATION',
//                 title,
//                 body,
//             });
//         });
//     });
// });
// // [END initialize_firebase_in_sw]
