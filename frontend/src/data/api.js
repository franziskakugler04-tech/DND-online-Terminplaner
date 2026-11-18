/* Zentraler API-Helper.
   Kapselt fetch + JWT-Auth-Header, damit Components nicht jedes Mal localStorage anfassen. */

function authHeaders() {
  const token = localStorage.getItem('cc_access');
  return token ? { Authorization: 'Bearer ' + token } : {};
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem('cc_refresh');
  if (!refresh) return false;
  try {
    const r = await fetch('/api/token/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!r.ok) return false;
    const data = await r.json();
    if (data.access) {
      localStorage.setItem('cc_access', data.access);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { ...authHeaders() };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const resp = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  // If token expired, try refresh once and retry the original request
  if (resp.status === 401) {
    const tryRefresh = await refreshAccessToken();
    if (tryRefresh) {
      const headers2 = { ...authHeaders() };
      if (body !== undefined) headers2['Content-Type'] = 'application/json';
      const resp2 = await fetch(path, {
        method,
        headers: headers2,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (resp2.status === 204) return null;
      const data2 = await resp2.json().catch(() => null);
      if (!resp2.ok) {
        const err2 = new Error(data2?.error || `HTTP ${resp2.status}`);
        err2.status = resp2.status;
        err2.data = data2;
        throw err2;
      }
      return data2;
    }
  }
  if (resp.status === 204) return null;
  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    const err = new Error(data?.error || `HTTP ${resp.status}`);
    err.status = resp.status;
    err.data = data;
    throw err;
  }
  return data;
}

/* ── Profil ─────────────────────────────── */

export const meApi = {
  laden: () =>
    request('/api/me/'),

  aktualisieren: (daten) =>
    request('/api/me/', { method: 'PATCH', body: daten }),
};

/* ── Freundschaften ─────────────────────── */

/* ── iCal ───────────────────────────────── */

export const icalApi = {
  getToken: () => request('/api/me/ical-token/'),
};

/* ── Freundschaften ─────────────────────── */

export const freundeApi = {
  suche: (q) =>
    request(`/api/spieler/?q=${encodeURIComponent(q)}`),

  liste: () =>
    request('/api/freunde/'),

  anfragen: () =>
    request('/api/freundschaftsanfragen/'),

  anfrageSenden: (empfaengerId) =>
    request('/api/freundschaften/', { method: 'POST', body: { empfaenger_id: empfaengerId } }),

  annehmen: (freundschaftId) =>
    request(`/api/freundschaften/${freundschaftId}/`, { method: 'PUT', body: { aktion: 'annehmen' } }),

  loeschen: (freundschaftId) =>
    request(`/api/freundschaften/${freundschaftId}/`, { method: 'DELETE' }),
};
