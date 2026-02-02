import { NextResponse } from "next/server";
import { authFetch } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

async function postStock(path: string, payload: Record<string, unknown>) {
  const upstream = await authFetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await upstream.json().catch(() => null);

  if (upstream.status !== 404) {
    return { status: upstream.status, data };
  }

  const fallback = await authFetch(`${API_BASE}/stock/movements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const fallbackData = await fallback.json().catch(() => null);

  return { status: fallback.status, data: fallbackData };
}

type StockLine = {
  itemId?: string | number;
  qty?: number;
  rate?: number;
};

type StockPayload = {
  date?: string;
  reason?: string;
  note?: string;
  refType?: string;
  refId?: string;
  lines?: StockLine[];
  createdById?: string | number;
};

export async function POST(request: Request) {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }

  let payload: StockPayload | null = null;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (!payload) {
    return NextResponse.json({ message: "Missing payload" }, { status: 400 });
  }

  delete payload.createdById;

  const lines = Array.isArray(payload.lines) ? payload.lines : [];
  const sanitizedLines = lines
    .map((line) => ({
      itemId: line.itemId,
      qty: line.qty != null ? Number(line.qty) : undefined,
      rate: line.rate != null ? Number(line.rate) : undefined,
    }))
    .filter((line) => line.itemId);

  if (sanitizedLines.length === 0) {
    return NextResponse.json(
      { message: "At least one line item is required" },
      { status: 400 }
    );
  }

  const cleanedPayload = {
    date: payload.date,
    reason: payload.reason,
    note: payload.note,
    refType: payload.refType,
    refId: payload.refId,
    lines: sanitizedLines,
  };

  const result = await postStock("/stock/in", cleanedPayload);

  return NextResponse.json(result.data, { status: result.status });
}
