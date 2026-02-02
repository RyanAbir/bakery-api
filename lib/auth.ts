import "server-only";
import { cookies } from "next/headers";

export const ACCESS_TOKEN_COOKIE = "admin_access_token";

export function getAccessToken() {
  return cookies().get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  const token = getAccessToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
