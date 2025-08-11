"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../lib/supabase";
import ResumeForm from "../components/ResumeForm";

interface Resume {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  github: string;
  experience: string;
  projects: string;
  education: string;
  skills: string;
  jobDescription: string;
  resumeType: string;
}

export default function Dashboard() {
  const [resume, setResume] = useState("");
  const [history, setHistory] = useState<Resume[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        // Check if user is authenticated
        
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
          router.push("/login");
          return;
        }

        if (!session?.user) {
          console.log("No authenticated user, redirecting to login");
          router.push("/login");
          return;
        }

        // User is authenticated, fetch data
        
        setUserId(session.user.id);
        setUserEmail(session.user.email || "Unknown User");

        // Fetch resume history
        
        const { data: resumeData } = await supabase
          .from("resumes")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        setHistory(resumeData || []);
        setLoading(false);
      } catch (err) {
        console.error("Error in dashboard:", err);
        router.push("/login");
      }
    };

    checkAuthAndFetchData();

    // Listen for auth changes
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const generateResume = async (formData: FormData) => {
    setResume(""); // Clear before new generation
    setResume(""); 
    setGenerating(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      const generatedContent = data.generated || data.error || "";
      setResume(generatedContent);

      // Save to database if user is authenticated and content was generated successfully
      
      if (userId && data.generated) {
        await supabase.from("resumes").insert({
          content: data.generated,
          user_id: userId,
        });

        // Refresh history
        
        const { data: newHistory } = await supabase
          .from("resumes")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        setHistory(newHistory || []);
      }
    } catch (error) {
      console.error("Error generating resume:", error);
      setResume("Error generating resume. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Download resume as DOCX
  
  const downloadResume = (content: string, filename?: string) => {
    // Create a simple HTML document structure for better formatting
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Times New Roman', serif; line-height: 1.6; margin: 40px; color: #333; }
          h1, h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
          h3 { color: #34495e; margin-top: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin: 20px 0; }
          .contact-info { text-align: center; margin: 15px 0; font-size: 14px; }
          ul { padding-left: 20px; }
          li { margin: 5px 0; }
          .experience-item { margin: 15px 0; }
          .company { font-weight: bold; color: #2980b9; }
          .position { font-style: italic; color: #7f8c8d; }
          .date { float: right; color: #95a5a6; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `resume-${Date.now()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-white/70 mt-4">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full animate-spin-slow"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-blue-500/5 to-purple-500/5 rounded-full animate-pulse"></div>
      </div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl animate-fade-in">
          <div className="flex justify-between items-center">
      <div className="relative z-10 p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6 shadow-2xl animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Resume Builder</h1>
                <p className="text-white/70">Create professional resumes with AI</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Resume Builder</h1>
                <p className="text-white/70 text-sm sm:text-base">Create professional resumes with AI</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <div className="text-left sm:text-right">
                <p className="text-white/70 text-sm">Welcome back</p>
                <p className="text-white font-medium">{userEmail}</p>
                <p className="text-white font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">{userEmail}</p>
              </div>
              <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 flex items-center space-x-2 text-sm flex-1 sm:flex-none justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>History</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200 px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 flex items-center space-x-2 text-sm flex-1 sm:flex-none justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>History</span>
              </button>
              <button
                onClick={handleSignOut}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200 px-4 py-2 rounded-xl transition-all duration-300 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Resume Form */}
        
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          
          <div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl animate-slide-up">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6 shadow-2xl animate-slide-up">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Create New Resume
              </h2>
              <ResumeForm onSubmit={generateResume} />
            </div>
          </div>

          {/* Generated Resume Document */}
          
          <div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl animate-slide-up-delay overflow-hidden">
              {/* Document Header */}
              <div className="bg-white/5 border-b border-white/10 p-4 flex items-center justify-between">
              
              <div className="bg-white/5 border-b border-white/10 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Resume Document</h3>
                    <h3 className="text-white font-semibold text-sm sm:text-base">Resume Document</h3>
                    <p className="text-white/60 text-xs">Professional format ready for download</p>
                  </div>
                </div>
                {resume && !generating && (
                  <button
                    onClick={() => downloadResume(resume)}
                    className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-200 px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 text-sm"
                    className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-200 px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 text-xs sm:text-sm w-full sm:w-auto justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download .doc</span>
                  </button>
                )}
              </div>

              {/* Document Content - INCREASED HEIGHT HERE */}
              <div className="p-6 h-[1200px] overflow-y-auto scrollbar-thin">
             
              <div className="p-3 sm:p-6 h-[600px] sm:h-[800px] lg:h-[1200px] overflow-y-auto scrollbar-thin">
                {generating ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                    <div className="text-center">
                      <p className="text-white font-medium">Generating Resume...</p>
                      <p className="text-white/60 text-sm mt-1">This may take a few moments</p>
                    </div>
                  </div>
                ) : resume ? (
                  <div className="bg-white rounded-lg p-6 shadow-lg min-h-full">
                  <div className="bg-white rounded-lg p-3 sm:p-6 shadow-lg min-h-full">
                    <div 
                      className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
                      className="prose prose-sm max-w-none text-gray-800 leading-relaxed text-xs sm:text-sm"
                      style={{
                        fontFamily: "'Times New Roman', serif",
                        lineHeight: '1.6'
                      }}
                      dangerouslySetInnerHTML={{ __html: resume }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center">
                      <svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white/70 font-medium">No resume generated yet</p>
                      <p className="text-white/50 text-sm mt-1">Fill out the form to create your professional resume</p>
                      <p className="text-white/70 font-medium text-sm sm:text-base">No resume generated yet</p>
                      <p className="text-white/50 text-xs sm:text-sm mt-1">Fill out the form to create your professional resume</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* History Modal/Panel */}
        
        {showHistory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-white/20">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center p-4 sm:p-6 border-b border-white/20">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Resume History
                </h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-white/70 hover:text-white transition-colors"
                  className="text-white/70 hover:text-white transition-colors p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh] scrollbar-thin">
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh] sm:max-h-[60vh] scrollbar-thin">
                {history.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <div className="text-center py-8 sm:py-12">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-white/50">No resumes generated yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((r, idx) => (
                      <div key={r.id || idx} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
                        <div className="prose prose-invert max-w-none text-white/80 max-h-64 overflow-y-auto scrollbar-thin">
                      <div key={r.id || idx} className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 hover:bg-white/10 transition-all duration-300">
                        <div className="prose prose-invert max-w-none text-white/80 max-h-32 sm:max-h-64 overflow-y-auto scrollbar-thin text-xs sm:text-sm">
                          <div dangerouslySetInnerHTML={{ __html: r.content }} />
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                          <p className="text-sm text-white/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 pt-4 border-t border-white/10 space-y-3 sm:space-y-0">
                          <p className="text-xs sm:text-sm text-white/50">
                            Created: {new Date(r.created_at).toLocaleString()}
                          </p>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => setResume(r.content)}
                              className="text-xs bg-purple-500/20 text-purple-200 px-3 py-1 rounded-lg hover:bg-purple-500/30 transition-colors"
                              className="text-xs bg-purple-500/20 text-purple-200 px-3 py-1 rounded-lg hover:bg-purple-500/30 transition-colors flex-1 sm:flex-none"
                            >
                              Preview
                            </button>
                            <button 
                              onClick={() => downloadResume(r.content, `resume-${new Date(r.created_at).toLocaleDateString()}.doc`)}
                              className="text-xs bg-blue-500/20 text-blue-200 px-3 py-1 rounded-lg hover:bg-blue-500/30 transition-colors"
                              className="text-xs bg-blue-500/20 text-blue-200 px-3 py-1 rounded-lg hover:bg-blue-500/30 transition-colors flex-1 sm:flex-none"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-slide-up { animation: slide-up 0.6s ease-out; }
        .animate-slide-up-delay { animation: slide-up 0.6s ease-out 0.1s both; }
        .animate-slide-up-delay-2 { animation: slide-up 0.6s ease-out 0.2s both; }
        .animate-slide-up-delay-3 { animation: slide-up 0.6s ease-out 0.3s both; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
