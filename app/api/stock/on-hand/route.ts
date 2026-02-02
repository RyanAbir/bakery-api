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

  const upstream = await authFetch(`${API_BASE}/stock/on-hand`, {
    cache: "no-store",
  });

  const data = await upstream.json().catch(() => null);

  return NextResponse.json(data, { status: upstream.status });
}
