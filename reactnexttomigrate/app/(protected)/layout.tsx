"use client";

import type React from "react";
import { useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import Navigation from "@/components/navigation";
import { OngoingBookingNotification } from "@/components/ongoing-booking-notification";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-1 pb-20 md:pb-4">{children}</main>
        <OngoingBookingNotification />
      </div>
    </AuthGuard>
  );
}
