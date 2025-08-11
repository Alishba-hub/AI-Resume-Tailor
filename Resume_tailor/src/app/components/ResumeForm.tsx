"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";

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

interface FieldHistory {
  [key: string]: string[];
}

interface ResumeFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
}

export default function ResumeForm({ onSubmit }: ResumeFormProps) {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    github: "",
    experience: "",
    projects: "",
    education: "",
    skills: "",
    jobDescription: "",
    resumeType: "Chronological",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldHistory, setFieldHistory] = useState<FieldHistory>({});
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHistory = localStorage.getItem("resumeFieldHistory");
      if (savedHistory) {
        setFieldHistory(JSON.parse(savedHistory));
      }
    }
  }, []);

  const cleanText = (text: string): string => {
    if (!text) return "";
    return text
      .replace(/[\t\v\f\r]+/g, " ")
      .replace(/\|/g, "")
      .replace(/ +/g, " ")
      .replace(/\n+/g, "\n")
      .replace(/\r/g, "")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join("\n")
      .trim()
      .replace(/"/g, "'");
  };

  const ultraCleanForJSON = (text: string): string => {
    if (!text) return "";
    return text
      .replace(/[\t\v\f\r\n]+/g, " ")
      .replace(/\|/g, "")
      .replace(/\\/g, "")
      .replace(/ +/g, " ")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .replace(/"/g, "'")
      .trim();
  };

  const cleanName = (text: string): string => {
    if (!text) return "";
    const firstLine = text.split("\n")[0]?.trim() || "";
    const cleaned = firstLine
      .replace(/[\t\v\f\r\|"]/g, " ")
      .replace(/ +/g, " ")
      .trim();
    const words = cleaned.split(" ").filter(word => word.length > 0);
    return words.slice(0, 2).join(" ");
  };

  const saveFieldHistory = (fieldName: string, value: string) => {
    if (!value.trim()) return;
    setFieldHistory((prev) => {
      const updated = { ...prev };
      if (!updated[fieldName]) {
        updated[fieldName] = [];
      }
      const filtered = updated[fieldName].filter(item => item !== value);
      updated[fieldName] = [value, ...filtered].slice(0, 5);
      if (typeof window !== "undefined") {
        localStorage.setItem("resumeFieldHistory", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const extractTextFromDOCX = async (file: File): Promise<string> => {
    try {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return cleanText(result.value);
    } catch (error) {
      console.error("DOCX extraction error:", error);
      throw new Error("Failed to extract text from DOCX");
    }
  };

  const extractTextFromTXT = async (file: File): Promise<string> => {
    return cleanText(await file.text());
  };

  const parseResumeText = (text: string) => {
    const lines = text.split("\n").map(line => line.trim()).filter(line => line);
    
    const nameMatch = lines[0] ? cleanName(lines[0]) : "";
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const emailMatch = text.match(emailPattern);
    const phonePattern = /(\+?1?[-.\s]?)?(\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/;
    const phoneMatch = text.match(phonePattern);
    const githubPattern = /(https?:\/\/)?(www\.)?github\.com\/[\w-]+/i;
    const githubMatch = text.match(githubPattern);
    
    const extractSection = (startKeywords: string[], endKeywords: string[] = []) => {
      const startPattern = new RegExp(`(${startKeywords.join("|")})`, "i");
      const endPattern = endKeywords.length > 0 ? new RegExp(`(${endKeywords.join("|")})`, "i") : null;
      
      const startIndex = lines.findIndex(line => startPattern.test(line));
      if (startIndex === -1) return "";
      
      let endIndex = lines.length;
      if (endPattern) {
        const foundEndIndex = lines.findIndex((line, index) => 
          index > startIndex && endPattern.test(line)
        );
        if (foundEndIndex !== -1) endIndex = foundEndIndex;
      }
      
      return cleanText(lines.slice(startIndex + 1, endIndex).join("\n"));
    };
    
    const updates: Partial<FormData> = {};
    if (nameMatch) updates.name = nameMatch;
    if (emailMatch) updates.email = cleanText(emailMatch[0]);
    if (phoneMatch) updates.phone = cleanText(phoneMatch[0]);
    if (githubMatch) updates.github = cleanText(githubMatch[0]);
    updates.experience = extractSection(
      ["experience", "work experience", "employment", "professional experience"],
      ["education", "skills", "projects", "certifications"]
    );
    updates.education = extractSection(
      ["education", "educational background", "academic background"],
      ["experience", "skills", "projects", "certifications"]
    );
    updates.skills = extractSection(
      ["skills", "technical skills", "technologies", "programming languages"],
      ["experience", "education", "projects", "certifications"]
    );
    updates.projects = extractSection(
      ["projects", "personal projects", "key projects"],
      ["experience", "education", "skills", "certifications"]
    );

    setForm(prev => ({ ...prev, ...updates }));
    return Object.keys(updates).length;
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setUploadError("");

    try {
      let extractedText = "";
      const fileType = file.type;
      const fileName = file.name.toLowerCase();

      if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || fileName.endsWith(".docx")) {
        extractedText = await extractTextFromDOCX(file);
      } else if (fileType === "text/plain" || fileName.endsWith(".txt")) {
        extractedText = await extractTextFromTXT(file);
      } else {
        throw new Error("Unsupported file format. Please upload DOCX or TXT files.");
      }

      const fieldsExtracted = parseResumeText(extractedText);
      setUploadError(fieldsExtracted > 0
        ? `✅ Successfully extracted ${fieldsExtracted} fields from your resume!`
        : "⚠️ File uploaded but no recognizable resume fields found. Please check the file format."
      );
    } catch (error) {
      setUploadError(`❌ ${error instanceof Error ? error.message : "Unknown error occurred"}`);
    } finally {
      setIsExtracting(false);
      event.target.value = "";
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === "name" ? cleanName(value) : value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const cleanedForm: FormData = {
        name: cleanName(form.name),
        email: ultraCleanForJSON(form.email),
        phone: ultraCleanForJSON(form.phone),
        github: ultraCleanForJSON(form.github),
        experience: ultraCleanForJSON(form.experience),
        projects: ultraCleanForJSON(form.projects),
        education: ultraCleanForJSON(form.education),
        skills: ultraCleanForJSON(form.skills),
        jobDescription: ultraCleanForJSON(form.jobDescription),
        resumeType: form.resumeType,
      };

      Object.entries(form).forEach(([key, value]) => {
        if (typeof value === "string" && value.trim() && key !== "resumeType") {
          saveFieldHistory(key, cleanText(value));
        }
      });
      
      await onSubmit(cleanedForm);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionClick = (fieldName: keyof FormData, value: string) => {
    setForm(prev => ({
      ...prev,
      [fieldName]: fieldName === "name" ? cleanName(value) : value
    }));
  };

  const renderField = (
    name: keyof FormData,
    label: string,
    placeholder: string,
    type: "input" | "textarea" | "email" = "input",
    rows?: number,
    required: boolean = false,
    autoComplete?: string
  ) => {
    const suggestions = fieldHistory[name] || [];
    
    return (
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          {label}
          {!required && <span className="text-white/50 text-xs ml-1">(Optional)</span>}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        
        {type === "textarea" ? (
          <textarea
            className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none hover:bg-white/15"
            name={name}
            placeholder={placeholder}
            rows={rows || 3}
            value={form[name]}
            onChange={handleChange}
            required={required}
          />
        ) : (
          <input
            className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:bg-white/15"
            type={type}
            name={name}
            placeholder={placeholder}
            value={form[name]}
            onChange={handleChange}
            autoComplete={autoComplete}
            required={required}
          />
        )}
        
        {suggestions.length > 0 && (
          <div className="mt-2">
            <details className="group">
              <summary className="text-xs text-white/60 cursor-pointer hover:text-white/80 flex items-center">
                <svg className="w-3 h-3 mr-1 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Previous entries
              </summary>
              <div className="mt-1 space-y-1 ml-4">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(name, suggestion)}
                    className="text-xs text-white/70 hover:text-white cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-all truncate"
                    title={suggestion}
                  >
                    {suggestion.length > 50 ? `${suggestion.substring(0, 50)}...` : suggestion}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-start space-x-3 mb-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-medium mb-1">Upload Existing Resume</h3>
            <p className="text-white/60 text-sm">Upload your resume to auto-fill the form fields</p>
          </div>
        </div>
        
        <label className="block">
          <input
            type="file"
            accept=".docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isExtracting}
          />
          <div className="border-2 border-dashed border-white/30 rounded-xl p-6 text-center hover:border-white/50 transition-all cursor-pointer">
            {isExtracting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                <span className="text-white/70">Extracting text from resume...</span>
              </div>
            ) : (
              <div>
                <svg className="w-8 h-8 text-white/50 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-white/70 text-sm">
                  <span className="font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-white/50 text-xs mt-1">DOCX or TXT files</p>
              </div>
            )}
          </div>
        </label>
        
        {uploadError && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            uploadError.startsWith("✅") 
              ? "bg-green-500/20 text-green-200" 
              : uploadError.startsWith("⚠️")
              ? "bg-yellow-500/20 text-yellow-200"
              : "bg-red-500/20 text-red-200"
          }`}>
            {uploadError}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {renderField("name", "Full Name", "Enter your full name", "input", undefined, true, "name")}
        {renderField("email", "Email Address", "your.email@example.com", "email", undefined, false, "email")}
        {renderField("phone", "Phone Number", "(555) 123-4567", "input", undefined, false, "tel")}
        {renderField("github", "GitHub Profile", "https://github.com/yourusername", "input", undefined, false, "url")}
        {renderField("experience", "Professional Experience", "Describe your work experience, roles, and achievements...", "textarea", 4)}
        {renderField("projects", "Projects", "List your projects, one per line or separated by commas...", "textarea", 3)}
        {renderField("education", "Education Background", "Your educational qualifications, degrees, certifications...", "textarea", 3)}
        {renderField("skills", "Skills", "List your skills, separated by commas (e.g., JavaScript, React, Node.js...)", "textarea", 2)}
        {renderField("jobDescription", "Job Description", "Paste the job description here to tailor your resume for this specific position...", "textarea", 4)}

        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Resume Type
            <span className="text-white/50 text-xs ml-1">(Optional)</span>
          </label>
          <select
            name="resumeType"
            value={form.resumeType}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:bg-white/15"
          >
            <option value="Chronological">Chronological</option>
            <option value="Functional">Functional</option>
            <option value="Combination">Combination</option>
            <option value="Targeted">Targeted</option>
          </select>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-6">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-white/80 text-sm font-medium mb-1">Quick Tips:</h4>
            <ul className="text-white/60 text-xs space-y-1">
              <li>• Upload your existing resume to auto-fill most fields</li>
              <li>• Only <strong className="text-white/80">Full Name</strong> is required</li>
              <li>• Click &ldquo;Previous entries&rdquo; to reuse your past information</li>
              <li>• Add job description to get a tailored resume</li>
              <li>• More details = better resume quality</li>
            </ul>
          </div>
        </div>
      </div>

      <button
        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        type="submit"
        disabled={isSubmitting || !form.name.trim()}
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Generate Resume</span>
          </>
        )}
      </button>
    </form>
  );
}
