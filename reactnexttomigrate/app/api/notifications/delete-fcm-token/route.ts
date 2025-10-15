import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const { userId, fcmToken } = await request.json();
    if (!userId || !fcmToken) {
      return NextResponse.json({ error: "Missing userId or fcmToken" }, { status: 400 });
    }
    await sql`DELETE FROM user_fcm_tokens WHERE user_id = ${userId} AND fcm_token = ${fcmToken}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete FCM token", details: String(error) }, { status: 500 });
  }
}
