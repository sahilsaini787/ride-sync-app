"use client"

import { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/lib/api"

interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: string
}

interface LocationSyncOptions {
  rideId: string
  updateInterval?: number
  enableHighAccuracy?: boolean
}

export function useLocationSync({ rideId, updateInterval = 5000, enableHighAccuracy = true }: LocationSyncOptions) {
  const [isTracking, setIsTracking] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  const syncLocationToServer = useCallback(
    async (location: LocationData) => {
      try {
        const response = await apiClient.updateRideLocation(rideId, {
          latitude: location.latitude,
          longitude: location.longitude,
        })

        if (response.success) {
          setLastSyncTime(new Date())
          setError(null)
        } else {
          setError("Failed to sync location to server")
        }
      } catch (err) {
        setError("Network error while syncing location")
        console.error("Location sync error:", err)
      }
    },
    [rideId],
  )

  const startTracking = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser")
      return
    }

    setIsTracking(true)
    setError(null)

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout: 10000,
      maximumAge: 1000,
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString(),
      }

      setCurrentLocation(locationData)
      syncLocationToServer(locationData)
    }

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = "Unable to get location"
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location access denied by user"
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information unavailable"
          break
        case error.TIMEOUT:
          errorMessage = "Location request timed out"
          break
      }
      setError(errorMessage)
      setIsTracking(false)
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options)

    // Set up continuous tracking
    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, options)

    // Set up periodic sync interval
    const syncInterval = setInterval(() => {
      if (currentLocation) {
        syncLocationToServer(currentLocation)
      }
    }, updateInterval)

    return () => {
      navigator.geolocation.clearWatch(watchId)
      clearInterval(syncInterval)
    }
  }, [enableHighAccuracy, updateInterval, syncLocationToServer, currentLocation])

  const stopTracking = useCallback(() => {
    setIsTracking(false)
    setCurrentLocation(null)
    setError(null)
  }, [])

  useEffect(() => {
    let cleanup: (() => void) | undefined

    if (isTracking) {
      cleanup = startTracking()
    }

    return cleanup
  }, [isTracking, startTracking])

  return {
    isTracking,
    currentLocation,
    error,
    lastSyncTime,
    startTracking: () => setIsTracking(true),
    stopTracking,
  }
}
