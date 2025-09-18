"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, LogOut, Settings, Bell, ArrowLeft, RefreshCw } from "lucide-react"
import { GoogleMap } from "@/components/google-map"

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY"
import { AlertCenter } from "@/components/alert-center"
import { LocationTracker } from "@/components/location-tracker"
import { useAlertSystem } from "@/hooks/use-alert-system"
import { useRealTimeUpdates } from "@/hooks/use-real-time-updates"
import { apiClient, type Ride, type User } from "@/lib/api"

interface MapDashboardProps {
  ride: any // Can be either a Group or Ride
  currentUser: User
  onBackToRides: () => void
}

export function MapDashboard({ ride, currentUser, onBackToRides }: MapDashboardProps) {
  const [activeRide, setActiveRide] = useState<Ride | null>(null)
  const [currentUserLocation, setCurrentUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocationTracking, setIsLocationTracking] = useState(false)
  const [showLocationTracker, setShowLocationTracker] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const {
    alerts,
    removeAlert,
    showLocationAlert,
    showTrafficAlert,
    showErrorAlert,
    showSuccessAlert,
    addAlert,
    sendEmergencyAlert,
  } = useAlertSystem({ rideId: activeRide?.id, enableServerSync: true })

  const {
    members: rideMembers,
    isConnected,
    error: updateError,
    lastUpdate,
    refreshUpdates,
  } = useRealTimeUpdates({
    rideId: activeRide?.id || "",
    pollInterval: 3000,
  })

  useEffect(() => {
    initializeRide()
  }, [ride])

  useEffect(() => {
    if (updateError) {
      setError(updateError)
    }
  }, [updateError])

  // Anomaly detection: alert if any member hasn't updated location in >5 minutes
  useEffect(() => {
    if (!rideMembers || rideMembers.length === 0) return
    const now = Date.now()
    rideMembers.forEach((member) => {
      if (
        member.lastLocationUpdate &&
        now - new Date(member.lastLocationUpdate).getTime() > 5 * 60 * 1000 // 5 minutes
      ) {
        addAlert(
          `Location anomaly: ${member.user.name} has not updated location for over 5 minutes`,
          "warning",
          10000
        )
      }
    })
  }, [rideMembers, addAlert])

  const initializeRide = async () => {
    try {
      setLoading(true)

      if (ride.type === "group") {
        // Create a new ride for this group
        const response = await apiClient.createRide({
          groupId: ride.id,
          name: ride.name || "Group Ride",
          description: ride.description || "",
          startLocation: "",
          endLocation: "",
        })

        if (response.success) {
          setActiveRide(response.data)
          showSuccessAlert("Ride started successfully!")
        } else {
          setError("Failed to start ride")
          showErrorAlert("Failed to start ride")
        }
      } else {
        // Existing ride
        setActiveRide(ride)
      }
    } catch (err) {
      setError("Failed to initialize ride")
      showErrorAlert("Failed to initialize ride")
      console.error("Error initializing ride:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleLocationUpdate = (location: { lat: number; lng: number }) => {
    setCurrentUserLocation(location)
  }

  const handleToggleLocationTracking = () => {
    setIsLocationTracking(!isLocationTracking)
    if (!isLocationTracking) {
      showSuccessAlert("Location sharing started - your position is now visible to group members")
    } else {
      setCurrentUserLocation(null)
      addAlert("Location sharing stopped", "info")
    }
  }

  const handleEndRide = async () => {
    if (!activeRide) return

    try {
      const response = await apiClient.endRide(activeRide.id)
      if (response.success) {
        showSuccessAlert("Ride ended successfully")
        onBackToRides()
      } else {
        showErrorAlert("Failed to end ride")
      }
    } catch (err) {
      showErrorAlert("Failed to end ride")
      console.error("Error ending ride:", err)
    }
  }

  const handleSendEmergencyAlert = () => {
    const message = "Emergency assistance needed!"
    sendEmergencyAlert(message)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "arrived":
        return "bg-green-500"
      case "on-route":
        return "bg-primary"
      case "waiting":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "arrived":
        return "Arrived"
      case "on-route":
        return "On Route"
      case "waiting":
        return "Waiting"
      default:
        return "Unknown"
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Starting ride...</p>
        </div>
      </div>
    )
  }

  if (!activeRide) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to start ride</p>
          <Button onClick={onBackToRides} className="mt-4">
            Back to Groups
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBackToRides}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-primary">{ride.name}</h1>
              <p className="text-xs text-muted-foreground">
                {activeRide.endLocation ? `→ ${activeRide.endLocation}` : ""}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{rideMembers.length} members</span>
            <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
              {isConnected ? "Live" : "Offline"}
            </Badge>
          </div>
          {alerts.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Bell className="h-4 w-4" />
              <Badge variant="secondary" className="text-xs">
                {alerts.length}
              </Badge>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={refreshUpdates}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowLocationTracker(!showLocationTracker)}>
            <Settings className="h-4 w-4 mr-2" />
            Location
          </Button>
          <Button variant="outline" size="sm" onClick={handleEndRide}>
            <LogOut className="h-4 w-4 mr-2" />
            End Ride
          </Button>
        </div>
      </header>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md mx-4 mt-2">{error}</div>
      )}

      <div className="flex-1 flex">
        {/* Sidebar with member list and location tracker */}
        <aside className="w-80 bg-card border-r border-border p-4 overflow-y-auto space-y-4">
          {showLocationTracker && (
            <LocationTracker
              rideId={activeRide.id}
              onLocationUpdate={handleLocationUpdate}
              isTracking={isLocationTracking}
              onToggleTracking={handleToggleLocationTracking}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Ride Members
                {lastUpdate && (
                  <span className="text-xs text-muted-foreground font-normal">
                    Updated {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rideMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm flex items-center gap-2">
                      {member.user.name}
                      {member.user.id === currentUser.id && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">@{member.user.username}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {member.lastLocationUpdate
                        ? `Updated ${new Date(member.lastLocationUpdate).toLocaleTimeString()}`
                        : "No location data"}
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(member.status)} text-white`}>
                    {getStatusText(member.status)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        {/* Main map area */}
        <main className="flex-1 relative">
          <GoogleMap
            apiKey={GOOGLE_MAPS_API_KEY}
            members={rideMembers
              .filter((member) => typeof member.latitude === "number" && typeof member.longitude === "number")
              .map((member) => ({
                id: member.id,
                name: member.user.name,
                username: member.user.username,
                email: member.user.email,
                status: member.status,
                location: { lat: member.latitude, lng: member.longitude },
                lastUpdate: new Date(member.lastLocationUpdate || Date.now()),
              }))}
          />
        </main>
      </div>

      <AlertCenter alerts={alerts} onDismiss={removeAlert} onSendEmergencyAlert={handleSendEmergencyAlert} />
    </div>
  )
}
