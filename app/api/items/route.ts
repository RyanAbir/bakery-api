import { NextResponse } from "next/server";
import { authFetch } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  if (!API_BASE) {
    return NextResponse.json(
      { message: "Missing API base URL" },
      { status: 500 }
    );
  }

  const upstream = await authFetch(`${API_BASE}/items`, {
    cache: "no-store",
  });

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
    return NextResponse.json(
      { message: "Missing API base URL" },
      { status: 500 }
    );
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

  const upstream = await authFetch(`${API_BASE}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      categoryId,
      unitId,
      reorderLevel: Number(reorderLevel ?? 0),
      trackExpiry: Boolean(trackExpiry ?? false),
    }),
  });

  const data = await upstream.json().catch(() => null);

  return NextResponse.json(data, { status: upstream.status });
}
