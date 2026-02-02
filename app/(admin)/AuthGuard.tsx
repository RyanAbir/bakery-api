"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, getToken } from "@/lib/api";

type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        await apiGet("/auth/me");
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to verify session."
          );
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="px-4 py-8 text-sm text-zinc-600">
        Checking session...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return <>{children}</>;
}
