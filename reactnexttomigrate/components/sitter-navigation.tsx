"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image" // Import Image component
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/contexts/auth-context"
import { Home, User, Wallet, Calendar, Menu, LogOut, LifeBuoy } from "lucide-react" // Import LifeBuoy for support

const navigation = [
  { name: "Dashboard", href: "/sitter", icon: Home },
  { name: "Profile", href: "/sitter/profile", icon: User },
  { name: "Wallet", href: "/sitter/wallet", icon: Wallet },
  { name: "Bookings", href: "/sitter/bookings", icon: Calendar },
  { name: "Support", href: "/sitter/support", icon: LifeBuoy }, // Added Support link
]

export default function SitterNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { sitter, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (!sitter) return null

  return (
    <nav className="bg-zubo-background-50 shadow-sm border-b border-zubo-background-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/sitter" className="flex items-center space-x-2">
              <Image
                src="/logo/zubo-logo.svg"
                alt="ZuboPets Logo"
                width={160} // Increased width
                height={60} // Increased height
                className="h-12 w-auto" // Tailwind classes for responsive sizing
              />
              <span className="text-xl font-bold text-zubo-primary-800">Zubo Walkers Portal</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                      ? "bg-zubo-primary-100 text-zubo-primary-700"
                      : "text-zubo-text-600 hover:text-zubo-primary-800 hover:bg-zubo-background-100"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            {/* Add this after the navigation links and before the user menu */}
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-zubo-highlight-1-600 hover:text-zubo-highlight-1-700 hover:bg-zubo-highlight-1-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={sitter.photo || "/placeholder.svg"} alt={sitter.name} />
                    <AvatarFallback className="bg-zubo-primary-500 text-zubo-background-50">
                      {sitter.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-zubo-background-50 border-zubo-background-200"
                align="end"
                forceMount
              >
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-zubo-text-800">{sitter.name}</p>
                    <p className="w-[200px] truncate text-sm text-zubo-text-600">{sitter.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-zubo-background-200" />
                <DropdownMenuItem asChild className="text-zubo-text-700 hover:bg-zubo-background-100">
                  <Link href="/sitter/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-zubo-text-700 hover:bg-zubo-background-100">
                  <Link href="/sitter/wallet" className="flex items-center">
                    <Wallet className="mr-2 h-4 w-4" />
                    Wallet
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-zubo-text-700 hover:bg-zubo-background-100">
                  <Link href="/sitter/support" className="flex items-center">
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    Support
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zubo-background-200" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-zubo-highlight-1-600 hover:text-zubo-highlight-1-700 hover:bg-zubo-highlight-1-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden" size="icon">
                  <Menu className="h-5 w-5 text-zubo-primary-700" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[400px] bg-zubo-background-50 border-zubo-background-200"
              >
                <div className="flex flex-col space-y-4 mt-4">
                  <div className="flex items-center space-x-2 pb-4 border-b border-zubo-background-200">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={sitter.photo || "/placeholder.svg"} alt={sitter.name} />
                      <AvatarFallback className="bg-zubo-primary-500 text-zubo-background-50">
                        {sitter.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-zubo-text-800">{sitter.name}</p>
                      <p className="text-sm text-zubo-text-600">{sitter.email}</p>
                    </div>
                  </div>
                  {navigation.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${isActive
                            ? "bg-zubo-primary-100 text-zubo-primary-700"
                            : "text-zubo-text-600 hover:text-zubo-primary-800 hover:bg-zubo-background-100"
                          }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                  <div className="pt-4 border-t border-zubo-background-200">
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      className="w-full justify-start text-zubo-highlight-1-600 hover:text-zubo-highlight-1-700 hover:bg-zubo-highlight-1-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
