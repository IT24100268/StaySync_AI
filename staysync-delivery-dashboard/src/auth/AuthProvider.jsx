import { createContext, useContext, useMemo, useState } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem('access_token')))
  const [authLoading, setAuthLoading] = useState(false)
  const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('current_username') || '')

  const login = async ({ username, password }) => {
    setAuthLoading(true)
    try {
      const response = await api.post('/api/auth/token/', { username, password })
      const access = response?.data?.access
      const refresh = response?.data?.refresh

      if (!access) {
        throw new Error('No access token returned by API')
      }

      localStorage.setItem('access_token', access)
      if (refresh) {
        localStorage.setItem('refresh_token', refresh)
      }
      localStorage.setItem('current_username', username)
      setCurrentUsername(username)
      setIsAuthenticated(true)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error?.response?.data?.detail || 'Invalid credentials',
      }
    } finally {
      setAuthLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('current_username')
    setCurrentUsername('')
    setIsAuthenticated(false)
  }

  const value = useMemo(
    () => ({
      isAuthenticated,
      currentUsername,
      authLoading,
      login,
      logout,
    }),
    [isAuthenticated, currentUsername, authLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
