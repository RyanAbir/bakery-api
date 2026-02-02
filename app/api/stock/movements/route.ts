import { NextResponse } from "next/server";
import { authFetch } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: Request) {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }

  const url = new URL(request.url);
  const params = url.searchParams.toString();
  const query = params ? `?${params}` : "";

  const upstream = await authFetch(`${API_BASE}/stock/movements${query}`, {
    cache: "no-store",
  });

  const data = await upstream.json().catch(() => null);

  return NextResponse.json(data, { status: upstream.status });
}

export async function POST(request: Request) {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }

  let payload: Record<string, unknown> | null = null;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (!payload) {
    return NextResponse.json({ message: "Missing payload" }, { status: 400 });
  }

  const upstream = await authFetch(`${API_BASE}/stock/movements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await upstream.json().catch(() => null);

  return NextResponse.json(data, { status: upstream.status });
}
