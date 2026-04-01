const ROLE_HOME_PATH = {
  student: '/student/dashboard',
  hostel_owner: '/owner/dashboard',
  restaurant_owner: '/restaurant/dashboard',
  delivery: '/delivery/dashboard',
  admin: '/admin/dashboard',
  administrator: '/admin/dashboard',
  superadmin: '/admin/dashboard',
  super_admin: '/admin/dashboard',
}

export const normalizeRole = (value = '') => String(value || '').trim().toLowerCase()

const readStoredRole = () => {
  if (typeof window === 'undefined') return ''
  return normalizeRole(localStorage.getItem('user_type'))
}

export const resolveRole = (user) => {
  const isAdminUser = Boolean(user?.is_staff) || Boolean(user?.is_superuser)
  if (isAdminUser) {
    return 'administrator'
  }

  return normalizeRole(user?.user_type) || readStoredRole()
}

export const getHomePathForRole = (role) => {
  const normalizedRole = normalizeRole(role)
  return ROLE_HOME_PATH[normalizedRole] || '/'
}

export const hasAllowedRole = (role, allowedRoles = []) => {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return true

  const normalizedRole = normalizeRole(role)
  const normalizedAllowed = allowedRoles.map((item) => normalizeRole(item))

  return normalizedAllowed.includes(normalizedRole)
}
