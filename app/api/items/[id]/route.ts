import { NextResponse } from "next/server";
import { authFetch } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type UpdatePayload = {
  name?: string;
  categoryId?: string;
  unitId?: string;
  reorderLevel?: number;
  trackExpiry?: boolean;
  isActive?: boolean;
};

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!API_BASE) {
    return NextResponse.json(
      { message: "Missing API base URL" },
      { status: 500 }
    );
  }

  let payload: UpdatePayload | null = null;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const upstream = await authFetch(`${API_BASE}/items/${params.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });

  const data = await upstream.json().catch(() => null);

  return NextResponse.json(data, { status: upstream.status });
}
