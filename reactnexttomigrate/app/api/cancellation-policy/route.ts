import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Fetch the active cancellation policy
    const policies = await sql`
      SELECT 
        cp.id,
        cp.name,
        cp.description,
        cp.effective_from,
        cp.effective_to,
        cp.is_active,
        cp.created_at,
        cp.updated_at
      FROM cancellation_policies cp
      WHERE cp.is_active = true
      ORDER BY cp.effective_from DESC
      LIMIT 1
    `

    if (policies.length === 0) {
      return NextResponse.json(
        { error: "No active cancellation policy found" },
        { status: 404 }
      )
    }

    const policy = policies[0]

    // Fetch rules for this policy
    const rules = await sql`
      SELECT 
        id,
        min_hours_before_service,
        max_hours_before_service,
        refund_percent,
        notes,
        description
      FROM cancellation_rules
      WHERE policy_id = ${policy.id}
      ORDER BY 
        CASE 
          WHEN min_hours_before_service IS NULL THEN 0
          ELSE min_hours_before_service
        END ASC
    `

    return NextResponse.json({
      policy: {
        id: policy.id,
        name: policy.name,
        description: policy.description,
        effectiveFrom: policy.effective_from,
        effectiveTo: policy.effective_to,
        isActive: policy.is_active,
        createdAt: policy.created_at,
        updatedAt: policy.updated_at,
        rules: rules.map((rule) => ({
          id: rule.id,
          minHours: rule.min_hours_before_service,
          maxHours: rule.max_hours_before_service,
          refundPercent: Number(rule.refund_percent),
          notes: rule.notes,
          description: rule.description,
        })),
      },
    })
  } catch (error) {
    console.error("Error fetching cancellation policy:", error)
    return NextResponse.json(
      { error: "Failed to fetch cancellation policy" },
      { status: 500 }
    )
  }
}
