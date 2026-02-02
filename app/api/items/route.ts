import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function getToken(request: Request) {
  const authHeader = request.headers.get("authorization");
  const headerToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";
  const cookieToken = cookies().get("admin_access_token")?.value ?? "";
  return headerToken || cookieToken;
}

export async function GET(request: Request) {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }

  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const upstream = await fetch(`${API_BASE}/items`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!upstream.ok) {
    const text = (await upstream.text()) || upstream.statusText || "Request failed";
    return NextResponse.json({ error: text }, { status: upstream.status });
  }

  const data = await upstream.json().catch(() => null);

  return NextResponse.json(data, { status: upstream.status });
}

type CreatePayload = {
  name?: string;
  categoryId?: string;
  unitId?: string;
  reorderLevel?: number;
  trackExpiry?: boolean;
};

export async function POST(request: Request) {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }

  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CreatePayload | null = null;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const { name, categoryId, unitId, reorderLevel, trackExpiry } = payload ?? {};

  if (!name || !categoryId || !unitId) {
    return NextResponse.json(
      { message: "Name, categoryId, and unitId are required" },
      { status: 400 }
    );
  }

  const upstream = await fetch(`${API_BASE}/items`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      categoryId,
      unitId,
      reorderLevel: Number(reorderLevel ?? 0),
      trackExpiry: Boolean(trackExpiry ?? false),
    }),
  });

  if (!upstream.ok) {
    const text = (await upstream.text()) || upstream.statusText || "Request failed";
    return NextResponse.json({ error: text }, { status: upstream.status });
  }

  const data = await upstream.json().catch(() => null);

  return NextResponse.json(data, { status: upstream.status });
}
