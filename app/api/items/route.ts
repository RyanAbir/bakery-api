import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

async function getToken(request: Request) {
  const authHeader = request.headers.get("authorization");
  const headerToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("admin_access_token")?.value ?? "";

  return headerToken || cookieToken;
}

export async function GET(request: Request) {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }

  const token = await getToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(`${API_BASE}/items`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    const message = text || res.statusText || "Request failed";
    return NextResponse.json({ error: message }, { status: res.status });
  }

  if (!text) {
    return NextResponse.json(null, { status: res.status });
  }

  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json(text, { status: res.status });
  }
}

export async function POST(request: Request) {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }

  const token = await getToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown = null;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const res = await fetch(`${API_BASE}/items`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload ?? {}),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
