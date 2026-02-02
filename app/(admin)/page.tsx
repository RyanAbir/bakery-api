"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";

type MeResponse = {
  id: string;
  email: string;
  role: string;
};

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadMe() {
      try {
        const data = await apiGet<MeResponse>("/auth/me");
        setMe(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadMe();
  }, [router]);

  if (loading) {
    return (
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Home</h1>
        <p className="text-sm text-zinc-600">Loading profile...</p>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">Home</h1>
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <p className="text-sm text-zinc-600">
          Logged in as {me?.email ?? "unknown"} ({me?.role ?? "unknown"})
        </p>
      )}
    </section>
  );
}
