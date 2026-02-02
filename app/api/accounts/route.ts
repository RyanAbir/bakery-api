import { NextResponse } from "next/server";
import { authFetch } from "@/lib/auth";

const API_BASE = process.env.BACKEND_API_BASE_URL;

type AccountPayload = {
  name?: string;
  type?: string;
  openingBalance?: number;
  createdById?: string | number;
};

export async function GET() {
  if (!API_BASE) {
    throw new Error("BACKEND_API_BASE_URL is not set");
  }

  const upstream = await authFetch(`${API_BASE}/accounts`, {
    cache: "no-store",
  });

  const data = await upstream.json().catch(() => null);

  return NextResponse.json(data, { status: upstream.status });
}

export async function POST(request: Request) {
  if (!API_BASE) {
    throw new Error("BACKEND_API_BASE_URL is not set");
  }

  let payload: AccountPayload | null = null;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (!payload) {
    return NextResponse.json({ message: "Missing payload" }, { status: 400 });
  }

  delete payload.createdById;

  const { name, type, openingBalance } = payload;

  if (!name || !type) {
    return NextResponse.json(
      { message: "Name and type are required" },
      { status: 400 }
    );
  }

  const upstream = await authFetch(`${API_BASE}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      type,
      openingBalance:
        openingBalance != null ? Number(openingBalance) : undefined,
    }),
  });

  const data = await upstream.json().catch(() => null);

  return NextResponse.json(data, { status: upstream.status });
}
