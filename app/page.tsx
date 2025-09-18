"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/login-form"
import { RegisterForm } from "@/components/register-form"
import { MapDashboard } from "@/components/map-dashboard"
import { RideManagement } from "@/components/ride-management"
import { useAuth } from "@/hooks/use-auth"

/**
 * Home page component.
 * - Handles authentication state and main UI routing.
 * - Shows login/register forms for unauthenticated users.
 * - Shows ride management and dashboard for authenticated users.
 */
export default function Home() {
  const router = useRouter()
  // State to toggle between login and register forms
  const [showRegister, setShowRegister] = useState(false)
  // State to track the currently selected ride (for dashboard view)
  const [selectedRide, setSelectedRide] = useState<any>(null)
  // Authentication state from context
  const { user, isAuthenticated, isLoading } = useAuth()

  // Redirect to dashboard/ride management after login
  useEffect(() => {
    if (isAuthenticated && user) {
      // Optionally, you could navigate to a dashboard route if you have one
      // router.push("/dashboard")
      // For now, just let the UI update
    }
  }, [isAuthenticated, user, router])

  // Callback to select a ride and show dashboard
  const handleSelectRide = (ride: any) => {
    setSelectedRide(ride)
  }

  // UI branch: Show loading spinner while authentication state is loading
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

  // UI branch: If authenticated, show dashboard or ride management
  if (isAuthenticated && user) {
    if (selectedRide) {
      // Show dashboard for selected ride
      return <MapDashboard ride={selectedRide} currentUser={user} onBackToRides={() => setSelectedRide(null)} />
    }
    // Show ride management UI
    return <RideManagement onSelectRide={handleSelectRide} currentUser={user} />
  }

  // UI branch: If not authenticated, show login or register form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {showRegister ? (
          <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
        ) : (
          <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
        )}
      </div>
    </div>
  )
}
