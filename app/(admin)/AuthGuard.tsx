"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type AuthGuardProps = {
  children: ReactNode;
};

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length < 2) return "";
  return parts.pop()?.split(";").shift() ?? "";
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cookieToken = readCookie("admin_access_token");
    const storageToken =
      typeof window === "undefined"
        ? ""
        : localStorage.getItem("accessToken") ?? "";
    const token = cookieToken || storageToken;
    if (!token) {
      const query = searchParams.toString();
      const currentPath = query ? `${pathname}?${query}` : pathname;
      router.replace(`/login?from=${encodeURIComponent(currentPath)}`);
      return;
    }
    setReady(true);
  }, [pathname, router, searchParams]);

  if (!ready) {
    return (
      <div className="px-4 py-8 text-sm text-zinc-600">
        Checking session...
      </div>
    );
  }

  return <>{children}</>;
}
