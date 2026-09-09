"use client";

import { useEffect } from "react";

import { usePathname, useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthenticated === false) {
      router.push("/login");
    } else if (isAuthenticated === true && user?.mustChangePassword && pathname !== "/force-change-password") {
      router.push("/force-change-password");
    }
  }, [isAuthenticated, user, pathname, router]);

  if (isAuthenticated === null || isAuthenticated === false) {
    return (
      <div className="flex h-dvh w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user?.mustChangePassword && pathname !== "/force-change-password") {
    return (
      <div className="flex h-dvh w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
