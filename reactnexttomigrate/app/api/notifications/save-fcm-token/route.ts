import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true });
  try {
    const { userId, fcmToken, deviceInfo } = await request.json();
    if (!userId || !fcmToken) {
      return NextResponse.json({ error: "Missing userId or fcmToken" }, { status: 400 });
    }
    // Insert or update the token for this user/device
    await sql`
      INSERT INTO user_fcm_tokens (user_id, fcm_token, device_info, created_at)
      VALUES (${userId}, ${fcmToken}, ${deviceInfo || null}, NOW())
      ON CONFLICT (fcm_token) DO UPDATE SET user_id = EXCLUDED.user_id, device_info = EXCLUDED.device_info, created_at = NOW()
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save FCM token", details: String(error) }, { status: 500 });
  }
}
