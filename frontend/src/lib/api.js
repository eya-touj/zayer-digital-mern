function csrfCookie() {
  const entry = document.cookie.split('; ').find((item) => item.startsWith('zcsrf='));
  return entry ? decodeURIComponent(entry.slice('zcsrf='.length)) : '';
}

let csrfToken = '';

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (!['GET', 'HEAD', 'OPTIONS'].includes((options.method || 'GET').toUpperCase())) {
    const token = csrfToken || csrfCookie();
    if (token) headers.set('X-CSRF', token);
  }
  const response = await fetch(path, { ...options, headers, credentials: 'include' });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(payload.error || 'The request could not be completed'), payload);
  if (payload.csrf) csrfToken = payload.csrf;
  return payload;
}

export const api = {
  setCsrfToken: (token) => { csrfToken = token; },
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (path, file) => {
    const body = new FormData();
    body.append('file', file);
    return request(path, { method: 'POST', body });
  },
  uploadMany: async (path, files) => {
    const results = [];
    for (const file of files) results.push(await api.upload(path, file));
    return results;
  },
  uploadFolder: (path, body) => request(path, { method: 'POST', body }),
};
