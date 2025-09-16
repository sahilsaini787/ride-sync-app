"use client"

import { useState, useEffect, useCallback } from "react"
import { apiClient, type RideMember } from "@/lib/api"

interface RealTimeUpdatesOptions {
  rideId: string
  pollInterval?: number
}

export function useRealTimeUpdates({ rideId, pollInterval = 3000 }: RealTimeUpdatesOptions) {
  const [members, setMembers] = useState<RideMember[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchUpdates = useCallback(async () => {
    try {
      const response = await apiClient.getRideMembers(rideId)
      if (response.success) {
        setMembers(response.data)
        setLastUpdate(new Date())
        setError(null)
        setIsConnected(true)
      } else {
        setError("Failed to fetch ride updates")
        setIsConnected(false)
      }
    } catch (err) {
      setError("Network error while fetching updates")
      setIsConnected(false)
      console.error("Real-time update error:", err)
    }
  }, [rideId])

  useEffect(() => {
    // Initial fetch
    fetchUpdates()

    // Set up polling interval
    const interval = setInterval(fetchUpdates, pollInterval)

    return () => clearInterval(interval)
  }, [fetchUpdates, pollInterval])

  const refreshUpdates = useCallback(() => {
    fetchUpdates()
  }, [fetchUpdates])

  return {
    members,
    isConnected,
    error,
    lastUpdate,
    refreshUpdates,
  }
}
