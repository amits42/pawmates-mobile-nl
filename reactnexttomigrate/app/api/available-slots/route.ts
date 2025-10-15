import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
export const dynamic = "force-dynamic"

// Neon DB connection (ensure DATABASE_URL is set in your .env)
const sql = neon(process.env.DATABASE_URL!);

// 🔧 Configurable constant — can change later easily
const MAX_BOOKINGS_PER_SLOT = 2;

// 🕒 Working hours: 5 AM (05:00) to 10 PM (22:00)
const WORKING_HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // [5,6,...,22]

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
        return NextResponse.json(
            { error: "Missing 'date' parameter. Example: ?date=2025-10-08" },
            { status: 400 }
        );
    }

    try {
        // 🗓️ Fetch all bookings for the given date, excluding cancelled ones
        const bookings = await sql`
      SELECT time
      FROM bookings
      WHERE date = ${date} AND is_recurring = FALSE
      AND status NOT IN ('CANCELLED', 'USERCANCELLED');
    `;

        // 🧮 Count number of bookings per hour
        const hourCount: Record<number, number> = {};

        for (const row of bookings) {
            if (!row.time) continue;

            // Extract hour part safely (supports "08:00", "8:00 AM", etc.)
            const match = row.time.match(/(\d{1,2})/);
            if (!match) continue;

            let hour = parseInt(match[1], 10);
            if (hour < 0 || hour > 23) continue;

            hourCount[hour] = (hourCount[hour] || 0) + 1;
        }

        // ✅ Filter available slots based on limit
        const availableSlots = WORKING_HOURS.filter(
            (hour) => (hourCount[hour] || 0) < MAX_BOOKINGS_PER_SLOT
        ).map((hour) => `${hour}:00`);

        return NextResponse.json({ date, availableSlots });
    } catch (error) {
        console.error("Error fetching available slots:", error);
        return NextResponse.json(
            { error: "Failed to fetch available slots" },
            { status: 500 }
        );
    }
}
