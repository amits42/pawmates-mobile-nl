"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function SitterAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, sitter, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !loading) {
      // Check if we have a sitter OR a user with userType = 'SITTER'
      const isSitter = sitter || (user && user.userType === "sitter");

      if (!isSitter) {
        // Store intended path for post-login redirect
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname + window.location.search;
          localStorage.setItem("postLoginRedirect", currentPath);
        }
        console.log("🚫 SitterAuthGuard: No Zubo Walkers found, redirecting to login");
        router.push("/sitter-login");
      } else {
        console.log("✅ SitterAuthGuard: Sitter authenticated");
      }
    }
  }, [mounted, loading, user, sitter, router]);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  // Check if we have a sitter OR a user with userType = 'SITTER'
  const isSitter = sitter || (user && user.userType === "SITTER")

  if (!isSitter) {
    return null
  }

  return <>{children}</>
}
