"use client"

import { useAuth } from "@/hooks/use-auth"
import { RideManagement } from "@/components/ride-management"

/**
 * Rides page.
 * - Shows ride management UI for authenticated users.
 * - Redirects to home if not authenticated.
 */
export default function RidesPage() {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    // Redirect to home if not authenticated
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
    return null
  }

  // Provide a stub for onSelectRide (can be expanded later)
  const handleSelectRide = () => {}

  return <RideManagement currentUser={user} onSelectRide={handleSelectRide} />
}
