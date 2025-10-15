// app/api/client-logs/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("📱 Client log:", body); // This will appear in Vercel function logs

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("❌ Error parsing client log:", error);
        return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }
}
