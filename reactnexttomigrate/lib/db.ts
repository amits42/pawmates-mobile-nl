import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

// Optional: Configure neon to use fetch polyfill in Node.js
// This is not needed in environments that have native fetch (like Next.js App Router)
// neonConfig.fetchConnectionCache = true;

// Create a singleton database connection
let db: ReturnType<typeof createDrizzleClient>

function createDrizzleClient() {
  const sql = neon(process.env.DATABASE_URL!)
  return drizzle(sql)
}

// Get a database connection
export function getDb() {
  // For edge runtime, we don't want to use a singleton
  if (process.env.NEXT_RUNTIME === "edge") {
    return createDrizzleClient()
  }

  // For Node.js, use a singleton to avoid too many connections
  if (!db) {
    db = createDrizzleClient()
  }

  return db
}

// Raw SQL execution function
export async function executeSQL(query: string, params: any[] = []) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    return await sql(query, params)
  } catch (error) {
    console.error("SQL execution error:", error)
    throw error
  }
}

export const sql = neon(process.env.DATABASE_URL!)
