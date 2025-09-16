"use client"

import { Button } from "@/components/ui/button"
import { AlertNotification } from "@/components/alert-notification"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Bell } from "lucide-react"
import type { Alert } from "@/hooks/use-alert-system"

interface AlertCenterProps {
  alerts: Alert[]
  onDismiss: (id: string) => void
  onSendEmergencyAlert?: () => void
}

export function AlertCenter({ alerts, onDismiss, onSendEmergencyAlert }: AlertCenterProps) {
  const emergencyAlerts = alerts.filter((alert) => alert.type === "emergency")
  const regularAlerts = alerts.filter((alert) => alert.type !== "emergency")

  if (alerts.length === 0) return null

  return (
    <>
      {/* Emergency Alert Banner */}
      {emergencyAlerts.length > 0 && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-4 z-50 shadow-lg">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 animate-pulse" />
              <div>
                <div className="font-bold text-lg">EMERGENCY ALERT</div>
                <div className="text-sm">{emergencyAlerts[0].message}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {emergencyAlerts.length > 1 && (
                <Badge variant="secondary" className="bg-red-800 text-white">
                  +{emergencyAlerts.length - 1} more
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDismiss(emergencyAlerts[0].id)}
                className="bg-white text-red-600 hover:bg-red-50"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Regular Alert Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-40 max-w-sm">
        {/* Emergency Alert Button */}
        {onSendEmergencyAlert && (
          <div className="mb-4">
            <Button
              onClick={onSendEmergencyAlert}
              variant="destructive"
              size="sm"
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Send Emergency Alert
            </Button>
          </div>
        )}

        {/* Regular Alerts */}
        {regularAlerts.slice(-3).map((alert) => (
          <AlertNotification
            key={alert.id}
            message={alert.message}
            type={alert.type}
            timestamp={alert.timestamp}
            severity={alert.severity}
            onDismiss={() => onDismiss(alert.id)}
          />
        ))}

        {regularAlerts.length > 3 && (
          <div className="text-xs text-center text-muted-foreground bg-card/80 backdrop-blur-sm rounded px-2 py-1 border flex items-center justify-center gap-1">
            <Bell className="h-3 w-3" />+{regularAlerts.length - 3} more alerts
          </div>
        )}
      </div>
    </>
  )
}
