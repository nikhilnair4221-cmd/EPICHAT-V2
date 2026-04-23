export const API_BASE = 'http://127.0.0.1:8000';

export async function apiJson(path, options = {}) {
  const token = localStorage.getItem('epichat_token');
  const defaultHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
  
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || 'Request failed');
  }
  return res.json();
}

export function formatGlobalTime(isoStr) {
  try {
    if (!isoStr) return 'N/A';
    let parsedStr = isoStr;
    // If from Python UTC without 'Z', append 'Z' so it is parsed as UTC
    if (parsedStr.indexOf('Z') === -1 && parsedStr.indexOf('+') === -1 && parsedStr.indexOf('T') !== -1) {
      parsedStr += 'Z';
    }
    const d = new Date(parsedStr);
    if (isNaN(d.getTime())) return isoStr;

    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} | ${hours}:${mins}`;
  } catch {
    return isoStr;
  }
}

