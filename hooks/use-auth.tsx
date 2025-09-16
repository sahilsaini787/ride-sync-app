"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { apiClient, type User, type LoginRequest, type RegisterRequest } from "@/lib/api"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in on app start
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        if (token) {
          apiClient.setToken(token)
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

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token")
      if (refreshToken) {
        await apiClient.logout(refreshToken)
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear local state regardless of API call success
      setUser(null)
      apiClient.clearToken()
      localStorage.removeItem("refresh_token")
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
