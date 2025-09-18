/**
 * Authentication Context and Provider
 * 
 * Provides authentication state and actions (login, register, logout) to the app.
 * Uses React Context to share user info and auth functions across components.
 */

"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { apiClient, type User, type LoginRequest, type RegisterRequest } from "@/lib/api"

/**
 * AuthContextType defines the shape of authentication context.
 * - user: Current logged-in user or null
 * - isLoading: Loading state for async auth actions
 * - login: Function to log in a user
 * - register: Function to register a new user
 * - logout: Function to log out the user
 * - isAuthenticated: Boolean indicating if user is logged in
 */
interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

/**
 * AuthContext provides authentication state and actions to consumers.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider wraps the app and provides authentication state/actions.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // On mount, check if user is already logged in (token in localStorage).
    // If a token exists, set it in the API client and attempt to fetch the user profile.
    // If the profile fetch fails, clear the token (it may be expired or invalid).
    // Always set loading to false at the end.
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        if (token) {
          if (token) {
  apiClient.setToken(token)
}
          const response = await apiClient.getUserProfile()
          if (response.success) {
            setUser(response.data)
          } else {
            // Token might be expired, clear it
            localStorage.removeItem("auth_token")
            apiClient.clearToken()
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        localStorage.removeItem("auth_token")
        apiClient.clearToken()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  /**
   * Log in a user with credentials.
   * On success, sets user state and stores tokens.
   */
  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true)
      const response = await apiClient.login(credentials)

      if (response.success) {
        const { token, user: userData } = response.data
        apiClient.setToken(token)
        setUser(userData)

        // Store refresh token if provided
        if (response.data.refreshToken) {
          localStorage.setItem("refresh_token", response.data.refreshToken)
        }
      } else {
        throw new Error(response.message || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Register a new user.
   * On success, automatically logs in the user.
   */
  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true)
      const response = await apiClient.register(userData)

      if (response.success) {
        // After successful registration, automatically log in
        await login({ username: userData.username, password: userData.password })
      } else {
        throw new Error(response.message || "Registration failed")
      }
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Log out the current user.
   * Clears user state and tokens, calls API if refresh token exists.
   */
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token")
      if (refreshToken) {
        // Attempt to log out via API if a refresh token exists.
        await apiClient.logout(refreshToken)
      }
    } catch (error) {
      // Even if the API call fails, proceed to clear local state.
      console.error("Logout error:", error)
    } finally {
      // Clear local state and tokens regardless of API call success.
      setUser(null)
      apiClient.clearToken()
      localStorage.removeItem("refresh_token")
    }
  }

  // Context value provided to consumers.
  // This object contains all authentication state and actions for use throughout the app.
  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }
  
  // Provide the authentication context to all child components.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth hook to access authentication context.
 * Must be used within an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
