import { NextResponse } from "next/server";
import { authFetch } from "@/lib/auth";

const API_BASE = process.env.BACKEND_API_BASE_URL;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!API_BASE) {
    throw new Error("BACKEND_API_BASE_URL is not set");
  }

  const upstream = await authFetch(`${API_BASE}/items/${params.id}/deactivate`, {
    method: "PATCH",
  });

  const data = await upstream.json().catch(() => null);

  return NextResponse.json(data, { status: upstream.status });
}
