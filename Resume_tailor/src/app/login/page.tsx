"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "../lib/supabase";

export default function LoginContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error) {
      if (error.includes('expired') || error.includes('invalid')) {
        setMessage("Your login link has expired. Please request a new one below.");
      } else {
        setMessage(`Authentication error: ${error}`);
      }
    } else if (message) {
      setMessage(`${message}`);
    }

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("User already logged in, redirecting to dashboard");
        router.push("/dashboard");
      }
    };

    checkSession();
  }, [searchParams, router]);

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");

    if (!email || !email.includes("@")) {
      setMessage("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Login error:", error);
        setMessage("Error: " + error.message);
      } else {
        setMessage("Check your email for the login link.");
      }
    } catch (err) {
      console.error("Unexpected login error:", err);
      setMessage("An unexpected error occurred. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full animate-spin-slow"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-blue-500/10 to-purple-500/10 rounded-full animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-bounce-gentle">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 animate-slide-up">Welcome Back</h1>
            <p className="text-white/70 animate-slide-up-delay">Sign in with your magic link</p>
          </div>

          <div className="mb-6 animate-slide-up-delay-2">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleLogin()}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform animate-slide-up-delay-3 ${
              loading
                ? "bg-gray-500/50 cursor-not-allowed scale-95"
                : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:scale-105 hover:shadow-lg active:scale-95"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Sending Magic Link...
              </div>
            ) : (
              "Send Magic Link"
            )}
          </button>

          {message && (
            <div className={`mt-6 p-4 rounded-xl backdrop-blur-sm animate-fade-in ${
              message.includes('Check your email') || message.includes('✅')
                ? 'bg-green-500/20 border border-green-500/30 text-green-100'
                : 'bg-red-500/20 border border-red-500/30 text-red-100'
            }`}>
              <div className="flex items-center">
                {message.includes('Check your email') || message.includes('✅') ? (
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.218 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                <p className="text-sm">{message}</p>
              </div>
            </div>
          )}

          <div className="mt-8 text-center animate-slide-up-delay-4">
            <p className="text-white/50 text-sm">
              Secure authentication powered by magic links
            </p>
          </div>
        </div>

        <div className="absolute -top-4 -left-4 w-8 h-8 bg-purple-500 rounded-full opacity-20 animate-float"></div>
        <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-blue-500 rounded-full opacity-30 animate-float-delay"></div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-slide-up { animation: slide-up 0.6s ease-out; }
        .animate-slide-up-delay { animation: slide-up 0.6s ease-out 0.1s both; }
        .animate-slide-up-delay-2 { animation: slide-up 0.6s ease-out 0.2s both; }
        .animate-slide-up-delay-3 { animation: slide-up 0.6s ease-out 0.3s both; }
        .animate-slide-up-delay-4 { animation: slide-up 0.6s ease-out 0.4s both; }
        .animate-bounce-gentle { animation: bounce-gentle 2s ease-in-out infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delay { animation: float 6s ease-in-out infinite 3s; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
      `}</style>
    </div>
  );
}
