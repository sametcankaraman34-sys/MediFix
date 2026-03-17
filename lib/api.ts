import { logger } from './logger'

const API_BASE = '/api'

async function refreshToken(): Promise<string | null> {
  try {
    const sessionData = localStorage.getItem('supabase.auth.token')
    if (!sessionData) return null

    const session = JSON.parse(sessionData)
    if (!session.refresh_token) return null

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token })
    })

    const data = await response.json()
    if (data.success && data.data?.session) {
      localStorage.setItem('supabase.auth.token', JSON.stringify(data.data.session))
      return data.data.session.access_token
    }
    return null
  } catch (error) {
    logger.error('Error refreshing token:', error)
    return null
  }
}

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  
  if (typeof window !== 'undefined') {
    const sessionData = localStorage.getItem('supabase.auth.token')
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData)
        if (session.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
      } catch (e) {
      }
    }
  }
  
  return headers
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = getAuthHeaders()
  let response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  })

  if (response.status === 401) {
    const newToken = await refreshToken()
    if (newToken) {
      const retryHeaders = {
        ...headers,
        'Authorization': `Bearer ${newToken}`,
        ...options.headers
      }
      response = await fetch(url, {
        ...options,
        headers: retryHeaders
      })
      
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase.auth.token')
          localStorage.removeItem('userEmail')
          localStorage.removeItem('userName')
          window.location.href = '/login'
        }
        return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('userEmail')
        localStorage.removeItem('userName')
        window.location.href = '/login'
      }
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  return response
}

export async function fetchPersonnel() {
  const response = await fetchWithAuth(`${API_BASE}/personnel`)
  const data = await response.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function createPersonnel(personnel: any) {
  const response = await fetchWithAuth(`${API_BASE}/personnel`, {
    method: 'POST',
    body: JSON.stringify(personnel)
  })
  const data = await response.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function updatePersonnel(id: string, personnel: any) {
  const response = await fetchWithAuth(`${API_BASE}/personnel/${id}`, {
    method: 'PUT',
    body: JSON.stringify(personnel)
  })
  const data = await response.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function deletePersonnel(id: string) {
  const response = await fetchWithAuth(`${API_BASE}/personnel/${id}`, {
    method: 'DELETE'
  })
  const data = await response.json()
  if (!data.success) throw new Error(data.error)
  return data
}

export async function fetchServiceRequests() {
  const response = await fetchWithAuth(`${API_BASE}/service-requests`)
  const data = await response.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function createServiceRequest(request: any) {
  const response = await fetchWithAuth(`${API_BASE}/service-requests`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  const data = await response.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function updateServiceRequest(id: string, request: any) {
  const response = await fetchWithAuth(`${API_BASE}/service-requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request)
  })
  const data = await response.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function deleteServiceRequest(id: string) {
  const response = await fetchWithAuth(`${API_BASE}/service-requests/${id}`, {
    method: 'DELETE'
  })
  const data = await response.json()
  if (!data.success) throw new Error(data.error)
  return data
}

export async function fetchAppointments() {
  const response = await fetchWithAuth(`${API_BASE}/appointments`)
  const data = await response.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function createAppointment(appointment: any) {
  const response = await fetchWithAuth(`${API_BASE}/appointments`, {
    method: 'POST',
    body: JSON.stringify(appointment)
  })
  const data = await response.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function updateAppointment(id: string, appointment: any) {
  const response = await fetchWithAuth(`${API_BASE}/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(appointment)
  })
  const data = await response.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function deleteAppointment(id: string) {
  const response = await fetchWithAuth(`${API_BASE}/appointments/${id}`, {
    method: 'DELETE'
  })
  const data = await response.json()
  if (!data.success) throw new Error(data.error)
  return data
}

export async function fetchReports() {
  const response = await fetchWithAuth(`${API_BASE}/reports`)
  const data = await response.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function createReport(report: any) {
  const response = await fetchWithAuth(`${API_BASE}/reports`, {
    method: 'POST',
    body: JSON.stringify(report)
  })
  const data = await response.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function updateReport(id: string, report: any) {
  const response = await fetchWithAuth(`${API_BASE}/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify(report)
  })
  const data = await response.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function deleteReport(id: string) {
  const response = await fetchWithAuth(`${API_BASE}/reports/${id}`, {
    method: 'DELETE'
  })
  const data = await response.json()
  if (!data.success) throw new Error(data.error)
  return data
}
