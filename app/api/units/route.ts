import { NextResponse } from "next/server";
import { cookies } from "next/headers";

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

  const res = await fetch(`${API_BASE}/units`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
