import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const { name, emailOrPhone, petType, services } = await request.json();

    if (!name || !emailOrPhone) {
      return NextResponse.json({ success: false, message: "Name and Email/Phone are required." }, { status: 400 });
    }

    // Insert into waitlist_responses table
    await sql`
      INSERT INTO waitlist_responses (name, email_or_phone, pet_type, services)
      VALUES (${name}, ${emailOrPhone}, ${petType}, ${services})
    `;

    return NextResponse.json({ success: true, message: "Waitlist response saved." });
  } catch (error) {
    console.error("Error saving waitlist response:", error);
    return NextResponse.json({ success: false, message: "Failed to save response." }, { status: 500 });
  }
}
