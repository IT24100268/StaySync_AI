import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('access_token')))
  const [authLoading, setAuthLoading] = useState(false)
  const [currentUsername, setCurrentUsername] = useState(() => localStorage.getItem('current_username') || '')

  // Re-check authentication when tokens change
  useEffect(() => {
    const checkTokens = () => {
      const token = localStorage.getItem('access_token')
      setIsAuthenticated(Boolean(token))
    }
    
    // Check immediately
    checkTokens()
    
    // Check every 500ms for token changes (for cross-origin login)
    const interval = setInterval(checkTokens, 500)
    
    return () => clearInterval(interval)
  }, [])

  const login = async ({ username, password }) => {
    setAuthLoading(true)
    try {
      const response = await api.post('/api/auth/token/', { username, password })
      const access = response?.data?.access
      const refresh = response?.data?.refresh
      const user_type = response?.data?.user_type

      if (!access) {
        throw new Error('No access token returned by API')
      }

      // Check if user is a delivery partner
      if (user_type !== 'delivery') {
        return {
          success: false,
          message: 'This account is not registered as a delivery partner. Please register as a delivery partner first.',
        }
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
