"use client"

import { useState, useCallback, useEffect } from "react"
import { apiClient, type Alert as ApiAlert } from "@/lib/api"

export interface Alert {
  id: string
  message: string
  type: "info" | "warning" | "error" | "success" | "emergency"
  timestamp: Date
  duration?: number
  rideId?: string
  severity?: "low" | "medium" | "high" | "critical"
}

interface AlertSystemOptions {
  rideId?: string
  enableServerSync?: boolean
}

export function useAlertSystem({ rideId, enableServerSync = false }: AlertSystemOptions = {}) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [serverAlerts, setServerAlerts] = useState<ApiAlert[]>([])

  useEffect(() => {
    if (enableServerSync && rideId) {
      const fetchServerAlerts = async () => {
        try {
          const response = await apiClient.getRideAlerts(rideId)
          if (response.success) {
            setServerAlerts(response.data)
          }
        } catch (err) {
          console.error("Failed to fetch server alerts:", err)
        }
      }

      fetchServerAlerts()
      const interval = setInterval(fetchServerAlerts, 10000) // Poll every 10 seconds

      return () => clearInterval(interval)
    }
  }, [rideId, enableServerSync])

  const addAlert = useCallback(
    (message: string, type: Alert["type"] = "info", duration = 5000) => {
      const alert: Alert = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        message,
        type,
        timestamp: new Date(),
        duration,
        rideId,
      }

      setAlerts((prev) => [...prev, alert])

      // Auto-remove alert after duration
      if (duration > 0) {
        setTimeout(() => {
          removeAlert(alert.id)
        }, duration)
      }

      return alert.id
    },
    [rideId],
  )

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id))
  }, [])

  const clearAllAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  const sendServerAlert = useCallback(
    async (message: string, type: ApiAlert["type"], severity: ApiAlert["severity"] = "medium") => {
      if (!rideId) return

      try {
        const response = await apiClient.sendAlert({
          rideId,
          type,
          message,
          severity,
        })

        if (response.success) {
          // Add to local alerts as well
          addAlert(message, type === "emergency" ? "emergency" : "info", 0) // Don't auto-remove server alerts
        }
      } catch (err) {
        console.error("Failed to send server alert:", err)
        addAlert("Failed to send alert to server", "error")
      }
    },
    [rideId, addAlert],
  )

  const sendEmergencyAlert = useCallback(
    async (message: string) => {
      if (!rideId) return

      try {
        const response = await apiClient.sendEmergencyAlert(rideId, message)
        if (response.success) {
          addAlert(`EMERGENCY: ${message}`, "emergency", 0) // Emergency alerts don't auto-remove
        }
      } catch (err) {
        console.error("Failed to send emergency alert:", err)
        addAlert("Failed to send emergency alert", "error")
      }
    },
    [rideId, addAlert],
  )

  // Predefined alert types for common scenarios
  const showLocationAlert = useCallback(
    (memberName: string, action: string) => {
      const message = `${memberName} ${action}`
      addAlert(message, "info")
      if (enableServerSync) {
        sendServerAlert(message, "location_update", "low")
      }
    },
    [addAlert, enableServerSync, sendServerAlert],
  )

  const showTrafficAlert = useCallback(
    (message: string) => {
      const alertMessage = `Traffic Alert: ${message}`
      addAlert(alertMessage, "warning")
      if (enableServerSync) {
        sendServerAlert(alertMessage, "traffic", "medium")
      }
    },
    [addAlert, enableServerSync, sendServerAlert],
  )

  const showErrorAlert = useCallback(
    (message: string) => {
      const alertMessage = `Error: ${message}`
      addAlert(alertMessage, "error")
      if (enableServerSync) {
        sendServerAlert(alertMessage, "system", "high")
      }
    },
    [addAlert, enableServerSync, sendServerAlert],
  )

  const showSuccessAlert = useCallback(
    (message: string) => {
      addAlert(message, "success")
      if (enableServerSync) {
        sendServerAlert(message, "system", "low")
      }
    },
    [addAlert, enableServerSync, sendServerAlert],
  )

  const allAlerts = [
    ...alerts,
    ...serverAlerts.map((serverAlert) => ({
      id: serverAlert.id,
      message: serverAlert.message,
      type: serverAlert.type === "emergency" ? ("emergency" as const) : ("info" as const),
      timestamp: new Date(serverAlert.createdAt),
      rideId: serverAlert.rideId,
      severity: serverAlert.severity,
    })),
  ]

  return {
    alerts: allAlerts,
    addAlert,
    removeAlert,
    clearAllAlerts,
    showLocationAlert,
    showTrafficAlert,
    showErrorAlert,
    showSuccessAlert,
    sendServerAlert,
    sendEmergencyAlert,
  }
}
