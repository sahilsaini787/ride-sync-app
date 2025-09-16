"use client"

import { useEffect, useState } from "react"
import { X, Info, AlertTriangle, AlertCircle, CheckCircle, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface AlertNotificationProps {
  message: string
  type: "info" | "warning" | "error" | "success" | "emergency"
  onDismiss: () => void
  timestamp?: Date
  severity?: "low" | "medium" | "high" | "critical"
}

export function AlertNotification({ message, type, onDismiss, timestamp, severity }: AlertNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (type === "emergency") return // Emergency alerts don't auto-dismiss

    const duration = severity === "critical" ? 10000 : severity === "high" ? 7000 : 5000
    const interval = 50
    const decrement = (interval / duration) * 100

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - decrement
        if (newProgress <= 0) {
          clearInterval(progressTimer)
          handleDismiss()
          return 0
        }
        return newProgress
      })
    }, interval)

    return () => clearInterval(progressTimer)
  }, [type, severity])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 300) // Wait for animation to complete
  }

  const getIcon = () => {
    switch (type) {
      case "info":
        return <Info className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "error":
        return <AlertCircle className="h-4 w-4" />
      case "success":
        return <CheckCircle className="h-4 w-4" />
      case "emergency":
        return <Zap className="h-4 w-4 animate-pulse" />
    }
  }

  const getStyles = () => {
    switch (type) {
      case "info":
        return {
          container: "bg-accent text-accent-foreground border-accent shadow-lg",
          progress: "bg-accent-foreground/30",
        }
      case "warning":
        return {
          container: "bg-yellow-500 text-white border-yellow-600 shadow-lg",
          progress: "bg-white/30",
        }
      case "error":
        return {
          container: "bg-destructive text-destructive-foreground border-destructive shadow-lg",
          progress: "bg-destructive-foreground/30",
        }
      case "success":
        return {
          container: "bg-green-500 text-white border-green-600 shadow-lg",
          progress: "bg-white/30",
        }
      case "emergency":
        return {
          container: "bg-red-600 text-white border-red-700 shadow-xl animate-pulse",
          progress: "bg-white/30",
        }
    }
  }

  const getSeverityBadge = () => {
    if (!severity || type === "emergency") return null

    const severityColors = {
      low: "bg-blue-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      critical: "bg-red-500",
    }

    return (
      <Badge className={`${severityColors[severity]} text-white text-xs px-1 py-0`}>{severity.toUpperCase()}</Badge>
    )
  }

  const styles = getStyles()

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out relative overflow-hidden
        ${isVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-full opacity-0 scale-95"}
        ${styles.container}
        max-w-sm rounded-lg border flex items-start gap-3 p-4
        ${type === "emergency" ? "ring-2 ring-red-300" : ""}
      `}
    >
      {/* Progress bar - only show for non-emergency alerts */}
      {type !== "emergency" && (
        <div className="absolute bottom-0 left-0 h-1 bg-black/10 w-full">
          <div
            className={`h-full transition-all duration-75 ease-linear ${styles.progress}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getSeverityBadge()}
          {type === "emergency" && (
            <Badge className="bg-red-800 text-white text-xs px-1 py-0 animate-pulse">EMERGENCY</Badge>
          )}
        </div>
        <div className="text-sm font-medium leading-tight">{message}</div>
        {timestamp && <div className="text-xs opacity-75 mt-1">{timestamp.toLocaleTimeString()}</div>}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="flex-shrink-0 h-6 w-6 p-0 hover:bg-white/20 text-current"
        onClick={handleDismiss}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
