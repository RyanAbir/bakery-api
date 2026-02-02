export const TOKEN_KEY = "token";
export const AUTH_COOKIE = "admin_access_token";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

if (process.env.NODE_ENV !== "production") {
  console.log("API_BASE", API_BASE);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${AUTH_COOKIE}=${token}; path=/; samesite=lax${secure}`;
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
}

function handleUnauthorized() {
  clearToken();
  if (typeof window !== "undefined") {
    window.location.assign("/login");
  }
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });
}

async function apiRequest<T>(
  path: string,
  init: RequestInit,
  body?: unknown
) {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    body: body !== undefined ? JSON.stringify(body) : init.body,
  });

  if (response.status === 401) {
    handleUnauthorized();
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && "message" in data
        ? String((data as { message?: string }).message)
        : undefined) ||
      (data && typeof data === "object" && "error" in data
        ? String((data as { error?: string }).error)
        : undefined) ||
      (typeof data === "string" && data) ||
      response.statusText ||
      "Request failed";
    throw new Error(message);
  }

  return data as T;
}

export function apiGet<T = unknown>(path: string, init: RequestInit = {}) {
  return apiRequest<T>(path, { ...init, method: "GET" });
}

export function apiPost<T = unknown>(
  path: string,
  body: unknown,
  init: RequestInit = {}
) {
  return apiRequest<T>(path, { ...init, method: "POST" }, body);
}

export function apiPatch<T = unknown>(
  path: string,
  body: unknown,
  init: RequestInit = {}
) {
  return apiRequest<T>(path, { ...init, method: "PATCH" }, body);
}
