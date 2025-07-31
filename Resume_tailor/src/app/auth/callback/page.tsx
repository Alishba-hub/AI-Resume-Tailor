"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
export default function AuthCallback() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("🔍 Current URL:", window.location.href);
        console.log("🔍 Hash:", window.location.hash);
        console.log("🔍 Search:", window.location.search);

        // Check for error in URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (errorParam) {
          console.error("❌ Auth error from URL:", errorParam, errorDescription);
          setError(errorDescription || errorParam);
          router.push(`/login?error=${encodeURIComponent(errorDescription || errorParam)}`);
          return;
        }

        // Method 1: Try using Supabase's built-in hash handling
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ Session error:", error);
          // If it's an expired link, show a friendly message
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            setError("Your login link has expired. Please request a new one.");
          } else {
            setError(error.message);
          }
          router.push(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }

        if (data?.session) {
          console.log("✅ Session found via getSession:", data.session.user);
          router.push("/dashboard");
          return;
        }

        // Method 2: Manual hash parsing for magic links
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const tokenType = hashParams.get('token_type');

        console.log("🔍 Hash tokens found:", { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken,
          tokenType 
        });

        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            console.error("❌ setSession error:", sessionError);
            if (sessionError.message.includes('expired') || sessionError.message.includes('invalid')) {
              setError("Your login link has expired. Please request a new one.");
            } else {
              setError(sessionError.message);
            }
            router.push(`/login?error=${encodeURIComponent(sessionError.message)}`);
            return;
          }

          if (sessionData?.session) {
            console.log("✅ Authentication successful via setSession:", sessionData.session.user);
            router.push("/dashboard");
            return;
          }
        }

        // If we get here, no valid session was found
        console.log("ℹ️ No valid session found, redirecting to login");
        router.push("/login?message=Please log in to continue");

      } catch (err) {
        console.error("❌ Unexpected error:", err);
        setError("An unexpected error occurred during authentication");
        router.push("/login");
      }
    };

    // Add a small delay to ensure the URL is fully loaded
    const timer = setTimeout(handleAuthCallback, 100);
    return () => clearTimeout(timer);
  }, [router, supabase]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Authentication Error: {error}</p>
          <button 
            onClick={() => router.push("/login")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Logging you in...</p>
      </div>
    </div>
  );
}
