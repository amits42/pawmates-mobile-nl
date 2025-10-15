import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import twilio from "twilio";

// Twilio config
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER!;

// Onboarding Template SID (hardcoded)
const TEMPLATE_SID = "HXc148e978a3bf119f233369aa97a15936";

const DEBUG = true;
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export async function POST(request: Request) {
    try {
        // Middleware will attach x-user-id
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json(
                { success: false, message: "x-user-id missing" },
                { status: 400 }
            );
        }

        // Fetch user info
        const result = await sql`
      SELECT id, name, phone 
      FROM users 
      WHERE id = ${userId}
      LIMIT 1;
    `;

        const user = result.rows[0];
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Format recipient phone
        let toPhone = user.phone?.replace(/[^\d]/g, "") || "";
        if (!toPhone.startsWith("+")) toPhone = "+" + toPhone;

        // Content variables for Twilio template
        const contentVars = {
            "1": user.name || "Customer", // for {{1}}
            "2": 'book-service',                 // for {{2}} in the URL
        };

        if (DEBUG) console.log("Sending Onboarding WhatsApp template:", contentVars);

        const response = await client.messages.create({
            from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${toPhone}`,
            contentSid: TEMPLATE_SID,
            contentVariables: JSON.stringify(contentVars),
        });

        if (DEBUG) console.log("Onboarding WhatsApp SID:", response.sid);

        return NextResponse.json({
            success: true,
            message: "Onboarding WhatsApp notification sent 📱",
        });
    } catch (error) {
        console.error("Error sending onboarding WhatsApp:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to send onboarding WhatsApp notification",
                error: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
