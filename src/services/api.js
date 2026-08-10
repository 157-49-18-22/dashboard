/**
 * API Service — connects React frontend to Express backend
 * Base URL: http://localhost:5000/api
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Token helpers ──────────────────────────────────────────────
const getToken = () => localStorage.getItem("crm_token");
const setToken = (t) => localStorage.setItem("crm_token", t);
const clearToken = () => localStorage.removeItem("crm_token");

// ── Core fetch wrapper ─────────────────────────────────────────
const request = async (endpoint, options = {}) => {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      localStorage.removeItem("crm_user");
      // Notify App.jsx that the session expired so it can redirect to login
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    throw new Error(data.message || "Request failed");
  }

  return data;
};

// ── Auth ───────────────────────────────────────────────────────
export const authAPI = {
  login: async (email, password) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.token) setToken(data.token);
    return data;
  },

  logout: async () => {
    await request("/auth/logout", { method: "POST" });
    clearToken();
  },

  getMe: () => request("/auth/me"),
  refreshToken: () => request("/auth/refresh", { method: "POST" }),
};

// ── Queries ────────────────────────────────────────────────────
export const queriesAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/queries${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => request(`/queries/${id}`),
  create: (body) => request("/queries", { method: "POST", body: JSON.stringify(body) }),
  assign: (id, agentId, groupId, status) => request(`/queries/${id}/assign`, { method: "PATCH", body: JSON.stringify({ agentId, groupId, status }) }),
  resolve: (id) => request(`/queries/${id}/resolve`, { method: "PATCH" }),
  markRead: (id) => request(`/queries/${id}/read`, { method: "PATCH" }),
  delete: (id) => request(`/queries/${id}`, { method: "DELETE" }),
  getStats: () => request("/queries/stats/summary"),
};

// ── Messages ───────────────────────────────────────────────────
export const messagesAPI = {
  getByQuery: (queryId, params = {}) => {
    const qs = new URLSearchParams();
    if (params.limit) qs.set("limit", params.limit);
    const query = qs.toString();
    return request(`/queries/${queryId}/messages${query ? `?${query}` : ""}`);
  },
  send: (queryId, payload) =>
    request(`/queries/${queryId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  uploadAttachment: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return request("/messages/upload", {
      method: "POST",
      body: formData,
    });
  },
  getSent: () => request("/messages/sent"),
  
  // WhatsApp Template APIs
  getTemplates: () => request("/messages/templates"),
  getTemplatePreview: (templateName) =>
    request("/messages/templates/preview", {
      method: "POST",
      body: JSON.stringify({ templateName }),
    }),
  sendTemplate: (queryId, templateName, variables, header) =>
    request("/messages/templates/send", {
      method: "POST",
      body: JSON.stringify({ queryId, templateName, variables, header }),
    }),
};

// ── Agents ────────────────────────────────────────────────────
export const agentsAPI = {
  getAll: () => request("/agents"),
  getById: (id) => request(`/agents/${id}`),
  create: (body) => request("/agents", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/agents/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  updateStatus: (id, status) =>
    request(`/agents/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  delete: (id) => request(`/agents/${id}`, { method: "DELETE" }),
  getStats: () => request("/agents/stats/summary"),
  resetPassword: (id, newPassword) =>
    request(`/agents/${id}/reset-password`, {
      method: "PATCH",
      body: JSON.stringify({ newPassword }),
    }),
};

// ── Activity ───────────────────────────────────────────────────
export const activityAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/activity${qs ? `?${qs}` : ""}`);
  },
  getByAgent: (agentId) => request(`/activity/agent/${agentId}`),
  getByDate: (date) => request(`/activity/date/${date}`),
};

// ── Reports ────────────────────────────────────────────────────
export const reportsAPI = {
  getOverview: () => request("/reports/overview"),
  getAgentPerformance: (date) => request(`/reports/agents${date ? `?date=${date}` : ""}`),
  getTimeline: (days = 7) => request(`/reports/timeline?days=${days}`),
  getPriorityBreakdown: () => request("/reports/priority"),
};

// ── Groups ─────────────────────────────────────────────────────
export const groupsAPI = {
  getAll: () => request("/groups"),
  create: (body) => request("/groups", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/groups/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id) => request(`/groups/${id}`, { method: "DELETE" }),
};

export { getToken, setToken, clearToken };
