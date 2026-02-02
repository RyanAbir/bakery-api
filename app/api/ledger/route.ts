import { NextResponse } from "next/server";
import { authFetch } from "@/lib/auth";

const API_BASE = process.env.BACKEND_API_BASE_URL;

type LedgerPayload = {
  date?: string;
  accountId?: string | number;
  direction?: string;
  amount?: number;
  note?: string;
  refType?: string;
  refId?: string;
  createdById?: string | number;
};

export async function GET(request: Request) {
  if (!API_BASE) {
    throw new Error("BACKEND_API_BASE_URL is not set");
  }

  const url = new URL(request.url);
  const params = url.searchParams.toString();
  const query = params ? `?${params}` : "";

  const upstream = await authFetch(`${API_BASE}/ledger${query}`, {
    cache: "no-store",
  });

  const data = await upstream.json().catch(() => null);

  return NextResponse.json(data, { status: upstream.status });
}

export async function POST(request: Request) {
  if (!API_BASE) {
    throw new Error("BACKEND_API_BASE_URL is not set");
  }

  let payload: LedgerPayload | null = null;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (!payload) {
    return NextResponse.json({ message: "Missing payload" }, { status: 400 });
  }

  delete payload.createdById;

  const upstream = await authFetch(`${API_BASE}/ledger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await upstream.json().catch(() => null);

  return NextResponse.json(data, { status: upstream.status });
}
