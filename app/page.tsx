"use client"

import { useState } from "react"
import { LoginForm } from "@/components/login-form"
import { RegisterForm } from "@/components/register-form"
import { MapDashboard } from "@/components/map-dashboard"
import { RideManagement } from "@/components/ride-management"
import { useAuth } from "@/hooks/use-auth"

export default function Home() {
  const [showRegister, setShowRegister] = useState(false)
  const [selectedRide, setSelectedRide] = useState<any>(null)
  const { user, isAuthenticated, isLoading } = useAuth()

  const handleSelectRide = (ride: any) => {
    setSelectedRide(ride)
  }

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

  if (isAuthenticated && user) {
    if (selectedRide) {
      return <MapDashboard ride={selectedRide} currentUser={user} onBackToRides={() => setSelectedRide(null)} />
    }
    return <RideManagement onSelectRide={handleSelectRide} currentUser={user} />
  }

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
