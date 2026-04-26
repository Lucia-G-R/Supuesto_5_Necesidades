const BASE = '/api';

export async function apiFetch(path, options = {}) {
  const { useStore } = await import('../store.js');
  const token = useStore.getState().token;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API error');
  }
  return res.json();
}

export const api = {
  get:    (path)         => apiFetch(path),
  post:   (path, body)   => apiFetch(path, { method: 'POST',  body }),
  put:    (path, body)   => apiFetch(path, { method: 'PUT',   body }),
  patch:  (path, body)   => apiFetch(path, { method: 'PATCH', body }),
  delete: (path)         => apiFetch(path, { method: 'DELETE' }),
};
