"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Spinner from "@/components/ui/Spinner";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.role === "ADMIN") router.replace("/admin");
    else if (user.role === "MENTOR") router.replace("/client");
    else router.replace("/welcome");
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
      <Spinner size="lg" />
    </div>
  );
}
