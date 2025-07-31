"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/login"); // OR directly to "/dashboard"
  }, [router]);

  return <p>Redirecting...</p>;
}
