"use client"

import type React from "react"
import { SitterAuthGuard } from "@/components/sitter-auth-guard"
import SitterNavigation from "@/components/sitter-navigation"

export default function SitterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SitterAuthGuard>
      <div className="flex flex-col min-h-screen">
        <SitterNavigation />
        <main className="flex-1 bg-gray-50 pb-20 md:pb-4">{children}</main>
      </div>
    </SitterAuthGuard>
  )
}
