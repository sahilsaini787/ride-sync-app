"use client"

import { useEffect, useRef } from "react"

interface Member {
  id: string
  name: string
  username: string
  status: string
  location: { lat: number; lng: number }
  lastUpdate: Date
}

interface GoogleMapProps {
  members: Member[]
}

export function GoogleMap({ members }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any | null>(null)
  const markersRef = useRef<Map<string, any>>(new Map())

  useEffect(() => {
    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google) {
        initializeMap()
        return
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`
      script.async = true
      script.defer = true
      script.onload = initializeMap
      document.head.appendChild(script)
    }

    const initializeMap = () => {
      if (!mapRef.current) return

      // Initialize map centered on San Francisco (default location)
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 13,
        center: { lat: 37.7749, lng: -122.4194 },
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      })

      mapInstanceRef.current = map
      updateMarkers()
    }

    loadGoogleMaps()
  }, [])

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers()
    }
  }, [members])

  const updateMarkers = () => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current
    const markers = markersRef.current

    // Remove markers that no longer exist
    markers.forEach((marker, id) => {
      if (!members.find((member) => member.id === id)) {
        marker.setMap(null)
        markers.delete(id)
      }
    })

    // Add or update markers for current members
    members.forEach((member) => {
      const existingMarker = markers.get(member.id)

      if (existingMarker) {
        // Update existing marker position
        existingMarker.setPosition(member.location)
      } else {
        // Create new marker
        const marker = new window.google.maps.Marker({
          position: member.location,
          map: map,
          title: member.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: getMarkerColor(member.status),
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        })

        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <h3 class="font-semibold">${member.name}</h3>
              <p class="text-sm text-gray-600">@${member.username}</p>
              <p class="text-sm"><span class="font-medium">Status:</span> ${getStatusText(member.status)}</p>
              <p class="text-xs text-gray-500">Updated: ${member.lastUpdate.toLocaleTimeString()}</p>
            </div>
          `,
        })

        marker.addListener("click", () => {
          infoWindow.open(map, marker)
        })

        markers.set(member.id, marker)
      }
    })

    // Adjust map bounds to fit all markers
    if (members.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      members.forEach((member) => {
        bounds.extend(member.location)
      })
      map.fitBounds(bounds)
    }
  }

  const getMarkerColor = (status: string) => {
    switch (status) {
      case "arrived":
        return "#22c55e" // green
      case "on-route":
        return "#ea580c" // orange (primary)
      case "waiting":
        return "#eab308" // yellow
      default:
        return "#6b7280" // gray
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

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full" />
      {!window.google && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">Loading Map...</div>
            <div className="text-sm text-muted-foreground">
              Note: Replace YOUR_GOOGLE_MAPS_API_KEY with your actual Google Maps API key
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
