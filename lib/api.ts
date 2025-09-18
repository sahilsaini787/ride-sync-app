/**
 * API Client and Type Definitions
 *
 * This file defines all major types for users, groups, rides, locations, alerts, and notification preferences.
 * It also provides the ApiClient class, which wraps all backend API endpoints for authentication, user, group,
 * ride, location, and alert management. Use apiClient for all server communication.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * User entity type
 */
// Types based on the swagger documentation
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Group entity type
 */
export interface Group {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * GroupMember entity type
 */
export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
  user: User;
}

/**
 * Ride entity type
 */
export interface Ride {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  startLocation?: string;
  endLocation?: string;
  status: "CREATED" | "STARTED" | "PAUSED" | "ENDED";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * LocationUpdate entity type
 */
export interface LocationUpdate {
  id: string;
  userId: string;
  rideId?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  user: User;
}

/**
 * Alert entity type
 */
export interface Alert {
  id: string;
  rideId: string;
  userId: string;
  type:
    | "location_update"
    | "status_change"
    | "emergency"
    | "traffic"
    | "system";
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  createdAt: string;
  readAt?: string;
}

/**
 * NotificationPreferences entity type
 */
export interface NotificationPreferences {
  locationUpdates: boolean;
  statusChanges: boolean;
  emergencyAlerts: boolean;
  trafficAlerts: boolean;
  systemNotifications: boolean;
}

/**
 * Generic API response type
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

// Request DTOs for API endpoints
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  name: string;
  password: string;
}

export interface GroupRequest {
  name: string;
  description?: string;
}

export interface RideRequest {
  groupId: string;
  name: string;
  description?: string;
  startLocation?: string;
  endLocation?: string;
}

export interface LocationUpdateRequest {
  rideId?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface AddMemberRequest {
  userId: string;
}

// ApiClient class wraps all backend API endpoints for authentication, user, group, ride, location, and alert management.
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  /**
   * Initialize ApiClient with base URL and optional token from localStorage.
   */
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // On initialization, attempt to retrieve an auth token from localStorage (browser only).
    // This allows the client to persist login state across page reloads.
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token");
    }
  }

  /**
   * Set authentication token for future requests.
   */
  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  /**
   * Clear authentication token.
   */
  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  /**
   * Internal method to make HTTP requests to the backend.
   * Adds auth token if available.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    // Always use a plain object for headers to allow property assignment
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // If an auth token is set, include it in the Authorization header for secure endpoints.
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // If the response is not OK, throw an error to be handled by the caller.
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse and return the JSON response.
      return await response.json();
    } catch (error) {
      // Log and rethrow errors for visibility and upstream handling.
      console.error("API request failed:", error);
      throw error;
    }
  }

  // ------------------ Authentication endpoints ------------------

  /**
   * Log in a user and receive tokens and user info.
   */
  async login(
    data: LoginRequest
  ): Promise<ApiResponse<{ token: string; refreshToken: string; user: User }>> {
    return this.request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Register a new user.
   */
  async register(data: RegisterRequest): Promise<ApiResponse<User>> {
    return this.request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Log out a user using refresh token.
   */
  async logout(refreshToken: string): Promise<ApiResponse<string>> {
    return this.request("/api/v1/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  /**
   * Refresh authentication token.
   */
  async refreshToken(
    refreshToken: string
  ): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
    return this.request("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  // ------------------ User endpoints ------------------

  /**
   * Get current user's profile.
   */
  async getUserProfile(): Promise<ApiResponse<User>> {
    return this.request("/api/v1/users/profile");
  }

  /**
   * Update current user's profile.
   */
  async updateUserProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request("/api/v1/users/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ------------------ Group endpoints ------------------

  /**
   * Get all groups for the current user.
   */
  async getUserGroups(): Promise<ApiResponse<Group[]>> {
    return this.request("/api/v1/groups");
  }

  /**
   * Create a new group.
   */
  async createGroup(data: GroupRequest): Promise<ApiResponse<Group>> {
    return this.request("/api/v1/groups", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get details for a specific group.
   */
  async getGroup(groupId: string): Promise<ApiResponse<Group>> {
    return this.request(`/api/v1/groups/${groupId}`);
  }

  /**
   * Get all members for a specific group.
   */
  async getGroupMembers(groupId: string): Promise<ApiResponse<GroupMember[]>> {
    return this.request(`/api/v1/groups/${groupId}/members`);
  }

  /**
   * Add a member to a group.
   */
  async addMemberToGroup(
    groupId: string,
    data: AddMemberRequest
  ): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Send an invite to a user to join a group.
   */
  async sendGroupInvite(
    groupId: string,
    data: { email: string }
  ): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/groups/${groupId}/invite`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ------------------ Ride endpoints ------------------

  /**
   * Get all rides for the current user.
   */
  async getUserRides(): Promise<ApiResponse<Ride[]>> {
    return this.request("/api/v1/rides");
  }

  /**
   * Get all rides for a specific group.
   */
  async getGroupRides(groupId: string): Promise<ApiResponse<Ride[]>> {
    return this.request(`/api/v1/rides/group/${groupId}`);
  }

  /**
   * Create a new ride.
   */
  async createRide(data: RideRequest): Promise<ApiResponse<Ride>> {
    return this.request("/api/v1/rides", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get details for a specific ride.
   */
  async getRide(rideId: string): Promise<ApiResponse<Ride>> {
    return this.request(`/api/v1/rides/${rideId}`);
  }

  /**
   * Update a ride's details.
   */
  async updateRide(
    rideId: string,
    data: Partial<RideRequest>
  ): Promise<ApiResponse<Ride>> {
    return this.request(`/api/v1/rides/${rideId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Start a ride.
   */
  async startRide(rideId: string): Promise<ApiResponse<Ride>> {
    return this.request(`/api/v1/rides/${rideId}/start`, {
      method: "POST",
    });
  }

  /**
   * Pause a ride.
   */
  async pauseRide(rideId: string): Promise<ApiResponse<Ride>> {
    return this.request(`/api/v1/rides/${rideId}/pause`, {
      method: "POST",
    });
  }

  /**
   * Resume a paused ride.
   */
  async resumeRide(rideId: string): Promise<ApiResponse<Ride>> {
    return this.request(`/api/v1/rides/${rideId}/resume`, {
      method: "POST",
    });
  }

  /**
   * End a ride.
   */
  async endRide(rideId: string): Promise<ApiResponse<Ride>> {
    return this.request(`/api/v1/rides/${rideId}/end`, {
      method: "POST",
    });
  }

  /**
   * Delete a ride.
   */
  async deleteRide(rideId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/rides/${rideId}`, {
      method: "DELETE",
    });
  }

  // ------------------ Location endpoints ------------------

  /**
   * Update user's location for a ride.
   */
  async updateLocation(
    data: LocationUpdateRequest
  ): Promise<ApiResponse<LocationUpdate>> {
    return this.request("/api/v1/location/update", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all location updates for a ride.
   */
  async getLocationUpdatesForRide(
    rideId: string
  ): Promise<ApiResponse<LocationUpdate[]>> {
    return this.request(`/api/v1/location/ride/${rideId}`);
  }

  /**
   * Get current locations for all members of a group.
   */
  async getCurrentGroupLocations(
    groupId: string
  ): Promise<ApiResponse<LocationUpdate[]>> {
    return this.request(`/api/v1/location/group/${groupId}/current`);
  }

  /**
   * Get all location updates for a group during a ride.
   */
  async getGroupLocationUpdatesForRide(
    groupId: string,
    rideId: string
  ): Promise<ApiResponse<LocationUpdate[]>> {
    return this.request(`/api/v1/location/group/${groupId}/ride/${rideId}`);
  }

  /**
   * Get location updates near a specific latitude/longitude.
   */
  async getNearbyLocationUpdates(
    latitude: number,
    longitude: number,
    radius?: number
  ): Promise<ApiResponse<LocationUpdate[]>> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    });
    if (radius) {
      params.append("radius", radius.toString());
    }
    return this.request(`/api/v1/location/nearby?${params}`);
  }

  // ------------------ Alert endpoints ------------------

  /**
   * Send an alert for a ride.
   */
  async sendAlert(data: {
    rideId: string;
    type: Alert["type"];
    message: string;
    severity: Alert["severity"];
  }): Promise<ApiResponse<Alert>> {
    return this.request("/api/v1/alerts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all alerts for a ride.
   */
  async getRideAlerts(rideId: string): Promise<ApiResponse<Alert[]>> {
    return this.request(`/api/v1/rides/${rideId}/alerts`);
  }

  /**
   * Mark an alert as read.
   */
  async markAlertAsRead(alertId: string): Promise<ApiResponse<void>> {
    return this.request(`/api/v1/alerts/${alertId}/read`, {
      method: "PATCH",
    });
  }

  /**
   * Get current user's notification preferences.
   */
  async getUserNotificationPreferences(): Promise<
    ApiResponse<NotificationPreferences>
  > {
    return this.request("/api/v1/user/notification-preferences");
  }

  /**
   * Update current user's notification preferences.
   */
  async updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<ApiResponse<NotificationPreferences>> {
    return this.request("/api/v1/user/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify(preferences),
    });
  }

  /**
   * Send an emergency alert for a ride.
   */
  async sendEmergencyAlert(
    rideId: string,
    message: string
  ): Promise<ApiResponse<Alert>> {
    return this.request("/api/v1/alerts/emergency", {
      method: "POST",
      body: JSON.stringify({
        rideId,
        message,
        type: "emergency",
        severity: "critical",
      }),
    });
  }
}

/**
 * Export a singleton instance of ApiClient for use throughout the app.
 * This ensures all API calls share the same token and configuration.
 */
export const apiClient = new ApiClient(API_BASE_URL);
