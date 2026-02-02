"use client";

import { useEffect, type ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    // Client-only initialization can go here.
  }, []);

  return <>{children}</>;
}
