// import { neon } from "@neondatabase/serverless";
// import admin from "firebase-admin";

// const sql = neon(process.env.DATABASE_URL!);

// // Initialize Firebase Admin SDK if not already initialized
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert({
//       projectId: process.env.FIREBASE_PROJECT_ID,
//       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//       privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
//     }),
//   });
// }

// export async function sendFcmNotification({ userIds, title, body }: { userIds: string[], title: string, body: string }) {

//   if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
//     throw new Error("Missing or invalid userIds array");
//   }
//   if (!title || !body) {
//     throw new Error("Missing title or body");
//   }
//   // Fetch all FCM tokens for the given users
//   const tokensResult = await sql`
//     SELECT fcm_token FROM user_fcm_tokens WHERE user_id = ANY(${userIds})
//   `;
//   const tokens = tokensResult.map((row: any) => row.fcm_token).filter(Boolean);
//   if (tokens.length === 0) {
//     throw new Error("No FCM tokens found for users");
//   }
//   // Send notification to all tokens
//   const response = await admin.messaging().sendEachForMulticast({
//     tokens,
//     notification: { title, body },
//   });
//   // Remove invalid tokens
//   const invalidTokens = response.responses
//     .map((r, i) => (!r.success && r.error?.code === 'messaging/registration-token-not-registered') ? tokens[i] : null)
//     .filter(Boolean);
//   if (invalidTokens.length > 0) {
//     await sql`DELETE FROM user_fcm_tokens WHERE fcm_token = ANY(${invalidTokens})`;
//   }
//   return response;
// }


export async function sendFcmNotification({ userIds, title, body }: { userIds: string[], title: string, body: string }) {

}
