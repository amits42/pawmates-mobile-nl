import { NextRequest, NextResponse } from "next/server";
import { sendFcmNotification } from "@/lib/sendFcmNotification";

export async function POST(request: NextRequest) {
  try {
    const { userIds, title, body } = await request.json();
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid userIds array" },
        { status: 400 }
      );
    }
    if (!title || !body) {
      return NextResponse.json({ error: "Missing title or body" }, { status: 400 });
    }
    const response = await sendFcmNotification({ userIds, title, body });
    return NextResponse.json({ success: true, response });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send FCM notification", details: String(error) },
      { status: 500 }
    );
  }
}
