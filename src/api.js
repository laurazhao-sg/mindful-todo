const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const taskApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/tasks${qs ? `?${qs}` : ''}`)
  },
  get: (id) => request(`/tasks/${id}`),
  create: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggle: (id) => request(`/tasks/${id}/toggle`, { method: 'PATCH' }),
  delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  addSubtask: (taskId, title) =>
    request(`/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  toggleSubtask: (taskId, subtaskId) =>
    request(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`, { method: 'PATCH' }),
  deleteSubtask: (taskId, subtaskId) =>
    request(`/tasks/${taskId}/subtasks/${subtaskId}`, { method: 'DELETE' }),
}

export const expenseApi = {
  list: (date) => {
    const qs = date ? `?date=${date}` : ''
    return request(`/expenses${qs}`)
  },
  summary: (days = 30) => request(`/expenses/summary?days=${days}`),
  create: (data) => request('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
}

export const userApi = {
  getProfile: () => request('/user/profile'),
  updateProfile: (data) =>
    request('/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getStats: () => request('/user/stats'),
  logFocus: (date, minutes) =>
    request('/user/focus', { method: 'POST', body: JSON.stringify({ date, minutes }) }),
}
