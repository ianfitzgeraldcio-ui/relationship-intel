const BASE = "/api";

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function qs(params: Record<string, string | number | boolean | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export const api = {
  login: (password: string) => request("/login", { method: "POST", body: JSON.stringify({ password }) }),
  logout: () => request("/logout", { method: "POST" }),
  session: () => request("/session"),
  healthSummary: () => request("/health-summary"),

  organizations: {
    list: (params: { query?: string; state?: string; org_type?: string; sector?: string } = {}) =>
      request(`/organizations${qs(params)}`),
    get: (id: string) => request(`/organizations/${id}`),
    relationships: (id: string) => request(`/organizations/${id}/relationships`),
    create: (data: any) => request("/organizations", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/organizations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id: string) => request(`/organizations/${id}`, { method: "DELETE" }),
  },

  contacts: {
    list: (params: { query?: string; organization_id?: string; role_category?: string; is_current?: boolean } = {}) =>
      request(`/contacts${qs(params)}`),
    get: (id: string) => request(`/contacts/${id}`),
    create: (data: any) => request("/contacts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/contacts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id: string) => request(`/contacts/${id}`, { method: "DELETE" }),
    addPositionHistory: (id: string, data: any) =>
      request(`/contacts/${id}/position-history`, { method: "POST", body: JSON.stringify(data) }),
    removePositionHistory: (id: string) => request(`/position-history/${id}`, { method: "DELETE" }),
    connections: (id: string) => request(`/contacts/${id}/connections`),
    warmIntro: (id: string) => request(`/contacts/${id}/warm-intro`),
  },

  contactConnections: {
    create: (data: any) => request("/contact-connections", { method: "POST", body: JSON.stringify(data) }),
    remove: (id: string) => request(`/contact-connections/${id}`, { method: "DELETE" }),
  },

  firmColleagues: {
    list: () => request("/firm-colleagues"),
    create: (data: any) => request("/firm-colleagues", { method: "POST", body: JSON.stringify(data) }),
  },

  relationships: {
    create: (data: any) => request("/relationships", { method: "POST", body: JSON.stringify(data) }),
    updateStrength: (id: string, strength_score: number) =>
      request(`/relationships/${id}/strength`, { method: "PATCH", body: JSON.stringify({ strength_score }) }),
    updateTemperature: (id: string, temperature: string) =>
      request(`/relationships/${id}/temperature`, { method: "PATCH", body: JSON.stringify({ temperature }) }),
    remove: (id: string) => request(`/relationships/${id}`, { method: "DELETE" }),
  },

  interactions: {
    create: (data: any) => request("/interactions", { method: "POST", body: JSON.stringify(data) }),
    forRelationship: (id: string) => request(`/relationships/${id}/interactions`),
    remove: (id: string) => request(`/interactions/${id}`, { method: "DELETE" }),
  },

  opportunities: {
    list: (params: { organization_id?: string; stage?: string } = {}) => request(`/opportunities${qs(params)}`),
    create: (data: any) => request("/opportunities", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/opportunities/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id: string) => request(`/opportunities/${id}`, { method: "DELETE" }),
    addContact: (id: string, data: any) =>
      request(`/opportunities/${id}/contacts`, { method: "POST", body: JSON.stringify(data) }),
    revenueForecast: (groupBy: "month" | "quarter" = "month") => request(`/revenue-forecast?group_by=${groupBy}`),
  },
};
