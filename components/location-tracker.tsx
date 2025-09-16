"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Wifi, WifiOff, RefreshCw } from "lucide-react"
import { useLocationSync } from "@/hooks/use-location-sync"

interface LocationTrackerProps {
  rideId: string
  onLocationUpdate?: (location: { lat: number; lng: number }) => void
  isTracking: boolean
  onToggleTracking: () => void
}

export function LocationTracker({ rideId, onLocationUpdate, isTracking, onToggleTracking }: LocationTrackerProps) {
  const {
    currentLocation,
    error: locationError,
    lastSyncTime,
    startTracking,
    stopTracking,
  } = useLocationSync({
    rideId,
    updateInterval: 5000,
    enableHighAccuracy: true,
  })

  useEffect(() => {
    if (isTracking) {
      startTracking()
    } else {
      stopTracking()
    }
  }, [isTracking, startTracking, stopTracking])

  useEffect(() => {
    if (currentLocation && onLocationUpdate) {
      onLocationUpdate({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      })
    }
  }, [currentLocation, onLocationUpdate])

  const formatCoordinate = (coord: number) => {
    return coord.toFixed(6)
  }

  const formatAccuracy = (acc: number) => {
    return acc < 1000 ? `${Math.round(acc)}m` : `${(acc / 1000).toFixed(1)}km`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Location Tracking
          {isTracking ? (
            <Badge className="bg-green-500 text-white">
              <Wifi className="h-3 w-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="secondary">
              <WifiOff className="h-3 w-3 mr-1" />
              Inactive
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Share Location</span>
          <Button onClick={onToggleTracking} variant={isTracking ? "destructive" : "default"} size="sm">
            {isTracking ? "Stop Sharing" : "Start Sharing"}
          </Button>
        </div>

        {locationError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{locationError}</p>
          </div>
        )}

        {currentLocation && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">Current Position</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">Lat:</span> {formatCoordinate(currentLocation.latitude)}
              </div>
              <div>
                <span className="font-medium">Lng:</span> {formatCoordinate(currentLocation.longitude)}
              </div>
            </div>
            {currentLocation.accuracy && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Accuracy:</span> {formatAccuracy(currentLocation.accuracy)}
              </div>
            )}
            {lastSyncTime && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                <span className="font-medium">Last Sync:</span> {lastSyncTime.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        {!(typeof navigator !== "undefined" && "geolocation" in navigator) && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">Geolocation is not supported by this browser.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
