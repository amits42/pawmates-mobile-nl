"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isNewUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      // User is not authenticated, store intended path and redirect to login
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname + window.location.search;
        localStorage.setItem("postLoginRedirect", currentPath);
      }
      router.push("/login");
    } else if (!loading && user && isNewUser) {
      // User is authenticated but needs to complete onboarding
      router.push("/onboarding/user-info");
    }
  }, [user, loading, isNewUser, router]);

  // Show nothing while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // If not authenticated, don't render children
  if (!user) {
    return null
  }

  // If authenticated but new user, don't render protected content
  if (isNewUser) {
    return null
  }

  // User is authenticated and not a new user, render children
  return <>{children}</>
}
