const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

// Types based on the swagger documentation
export interface User {
  id: string
  username: string
  email: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Group {
  id: string
  name: string
  description?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface GroupMember {
  id: string
  userId: string
  groupId: string
  role: "ADMIN" | "MEMBER"
  joinedAt: string
  user: User
}

export interface Ride {
  id: string
  groupId: string
  name: string
  description?: string
  startLocation?: string
  endLocation?: string
  status: "CREATED" | "STARTED" | "PAUSED" | "ENDED"
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface LocationUpdate {
  id: string
  userId: string
  rideId?: string
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: string
  user: User
}

export interface Alert {
  id: string
  rideId: string
  userId: string
  type: "location_update" | "status_change" | "emergency" | "traffic" | "system"
  message: string
  severity: "low" | "medium" | "high" | "critical"
  createdAt: string
  readAt?: string
}

export interface NotificationPreferences {
  locationUpdates: boolean
  statusChanges: boolean
  emergencyAlerts: boolean
  trafficAlerts: boolean
  systemNotifications: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp: string
}

// Request DTOs
export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  name: string
  password: string
}

export interface GroupRequest {
  name: string
  description?: string
}

export interface RideRequest {
  groupId: string
  name: string
  description?: string
  startLocation?: string
  endLocation?: string
}

export interface LocationUpdateRequest {
  rideId?: string
  latitude: number
  longitude: number
  accuracy?: number
}

export interface AddMemberRequest {
  userId: string
}

// API Client class
class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    // Try to get token from localStorage on initialization
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  // Authentication endpoints
  async login(data: LoginRequest): Promise<ApiResponse<{ token: string; refreshToken: string; user: User }>> {
    return this.request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async register(data: RegisterRequest): Promise<ApiResponse<User>> {
    return this.request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async logout(refreshToken: string): Promise<ApiResponse<string>> {
    return this.request("/api/v1/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    })
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
    return this.request("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    })
  }

  // User endpoints
  async getUserProfile(): Promise<ApiResponse<User>> {
    return this.request("/api/v1/users/profile")
  }

  async updateUserProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request("/api/v1/users/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // Group endpoints
  async getUserGroups(): Promise<ApiResponse<Group[]>> {
    return this.request("/api/v1/groups")
  }

  async createGroup(data: GroupRequest): Promise<ApiResponse<Group>> {
    return this.request("/api/v1/groups", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getGroup(groupId: string): Promise<ApiResponse<Group>> {
    return this.request(`/api/v1/groups/${groupId}`)
  }

  async getGroupMembers(groupId: string): Promise<ApiResponse<GroupMember[]>> {
    return this.request(`/api/v1/groups/${groupId}/members`)
  }

  async addMemberToGroup(groupId: string, data: AddMemberRequest): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async sendGroupInvite(groupId: string, data: { email: string }): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/groups/${groupId}/invite`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Ride endpoints
  async getUserRides(): Promise<ApiResponse<Ride[]>> {
    return this.request("/api/v1/rides")
  }

  async getGroupRides(groupId: string): Promise<ApiResponse<Ride[]>> {
    return this.request(`/api/v1/rides/group/${groupId}`)
  }

  async createRide(data: RideRequest): Promise<ApiResponse<Ride>> {
    return this.request("/api/v1/rides", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getRide(rideId: string): Promise<ApiResponse<Ride>> {
    return this.request(`/api/v1/rides/${rideId}`)
  }

  async updateRide(rideId: string, data: Partial<RideRequest>): Promise<ApiResponse<Ride>> {
    return this.request(`/api/v1/rides/${rideId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async startRide(rideId: string): Promise<ApiResponse<Ride>> {
    return this.request(`/api/v1/rides/${rideId}/start`, {
      method: "POST",
    })
  }

  async pauseRide(rideId: string): Promise<ApiResponse<Ride>> {
    return this.request(`/api/v1/rides/${rideId}/pause`, {
      method: "POST",
    })
  }

  async resumeRide(rideId: string): Promise<ApiResponse<Ride>> {
    return this.request(`/api/v1/rides/${rideId}/resume`, {
      method: "POST",
    })
  }

  async endRide(rideId: string): Promise<ApiResponse<Ride>> {
    return this.request(`/api/v1/rides/${rideId}/end`, {
      method: "POST",
    })
  }

  async deleteRide(rideId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/rides/${rideId}`, {
      method: "DELETE",
    })
  }

  // Location endpoints
  async updateLocation(data: LocationUpdateRequest): Promise<ApiResponse<LocationUpdate>> {
    return this.request("/api/v1/location/update", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getLocationUpdatesForRide(rideId: string): Promise<ApiResponse<LocationUpdate[]>> {
    return this.request(`/api/v1/location/ride/${rideId}`)
  }

  async getCurrentGroupLocations(groupId: string): Promise<ApiResponse<LocationUpdate[]>> {
    return this.request(`/api/v1/location/group/${groupId}/current`)
  }

  async getGroupLocationUpdatesForRide(groupId: string, rideId: string): Promise<ApiResponse<LocationUpdate[]>> {
    return this.request(`/api/v1/location/group/${groupId}/ride/${rideId}`)
  }

  async getNearbyLocationUpdates(
    latitude: number,
    longitude: number,
    radius?: number,
  ): Promise<ApiResponse<LocationUpdate[]>> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    })
    if (radius) {
      params.append("radius", radius.toString())
    }
    return this.request(`/api/v1/location/nearby?${params}`)
  }

  // Alert endpoints
  async sendAlert(data: {
    rideId: string
    type: Alert["type"]
    message: string
    severity: Alert["severity"]
  }): Promise<ApiResponse<Alert>> {
    return this.request("/api/v1/alerts", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getRideAlerts(rideId: string): Promise<ApiResponse<Alert[]>> {
    return this.request(`/api/v1/rides/${rideId}/alerts`)
  }

  async markAlertAsRead(alertId: string): Promise<ApiResponse<void>> {
    return this.request(`/api/v1/alerts/${alertId}/read`, {
      method: "PATCH",
    })
  }

  async getUserNotificationPreferences(): Promise<ApiResponse<NotificationPreferences>> {
    return this.request("/api/v1/user/notification-preferences")
  }

  async updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>,
  ): Promise<ApiResponse<NotificationPreferences>> {
    return this.request("/api/v1/user/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify(preferences),
    })
  }

  async sendEmergencyAlert(rideId: string, message: string): Promise<ApiResponse<Alert>> {
    return this.request("/api/v1/alerts/emergency", {
      method: "POST",
      body: JSON.stringify({
        rideId,
        message,
        type: "emergency",
        severity: "critical",
      }),
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL)
