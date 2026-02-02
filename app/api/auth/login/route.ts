import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: Request) {
  if (!API_BASE) {
    return NextResponse.json(
      { message: "Missing API base URL" },
      { status: 500 }
    );
  }

  let payload: { email?: string; password?: string } | null = null;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const email = payload?.email;
  const password = payload?.password;

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { message: "Email and password are required" },
      { status: 400 }
    );
  }

  const upstream = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Login failed" },
      { status: upstream.status }
    );
  }

  const accessToken =
    data?.accessToken ?? data?.token ?? data?.data?.accessToken;

  if (!accessToken || typeof accessToken !== "string") {
    return NextResponse.json(
      { message: "Login response missing access token" },
      { status: 502 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
