import api from './axios'

export async function loginUser({ username, password }) {
  const response = await api.post('/api/auth/token/', { username, password })
  return response.data
}

export function saveTokens({ access, refresh }) {
  if (access) {
    localStorage.setItem('access_token', access)
  }
  if (refresh) {
    localStorage.setItem('refresh_token', refresh)
  }
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export function getAccessToken() {
  return localStorage.getItem('access_token')
}
