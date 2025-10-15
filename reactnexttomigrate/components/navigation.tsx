"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Image from "next/image"
import { Home, Calendar, PlusCircle, User, HelpCircle } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navItems = [
  { href: "/landing", label: "Home", icon: Home },
  { href: "/book-service", label: "Book Walk", icon: PlusCircle },
  { href: "/my-bookings", label: "My Bookings", icon: Calendar },
  { href: "/user-faq", label: "FAQ", icon: HelpCircle },
  { href: "/profile", label: "Profile", icon: User },
]

export default function Navigation() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Only hide navigation on login or onboarding pages
  if (pathname === "/login" || pathname === "/onboarding") {
    return null
  }

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.phone) {
      return user.phone.slice(-2)
    }
    return "U"
  }

  return (
    <>
      {/* Top navigation for desktop */}
      <header className="hidden md:block border-b bg-zubo-background-50 shadow-sm sticky top-0 z-40">
        <div className="container flex h-16 items-center px-4 max-w-7xl mx-auto">
          <Link href="/" className="mr-6 flex items-center hover:opacity-80 transition-opacity">
            <Image src="/logo/zubo-logo.svg" alt="ZuboPets" width={400} height={400} className="h-32 w-auto" priority />
          </Link>

          <nav className="flex items-center space-x-2 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                    ? "text-zubo-text-600 bg-zubo-highlight-1 shadow-sm"
                    : "text-zubo-text-600 hover:text-zubo-primary-600 hover:bg-zubo-background-100"
                    }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-zubo-text-600 hidden lg:block font-medium">
                Welcome, {user.name?.split(" ")[0] || user.phone?.replace("+", "")}!
              </span>
              {/* <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-zubo-primary-100 text-zubo-primary-700 font-semibold text-sm">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar> */}
            </div>
          )}
        </div>
      </header>

      {/* Bottom navigation for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zubo-background-50 border-t border-zubo-background-200 px-2 py-2 z-50 md:hidden shadow-lg">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 min-w-0 ${isActive
                  ? "text-zubo-text-600 bg-zubo-highlight-1"
                  : "text-zubo-text-600 hover:text-zubo-primary-600 hover:bg-zubo-background-100"
                  }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
