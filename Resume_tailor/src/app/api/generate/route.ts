import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000); // ⏱️ 3 minutes timeout 

  try {
    const body = await req.json();

    //const webhook = "http://localhost:5678/webhook/resume_ai";
    const webhook =  "https://primary-production-2bf5.up.railway.app/webhook/7b1fa002-9cdf-4d2e-845f-46e2ae2c9525"
    const response = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Webhook returned status ${response.status}`);
    }

    const text = await response.text();

    try {
      const result = JSON.parse(text);
      
      // Extract and clean the content
      let cleanContent = "";
      if (result && Array.isArray(result) && result.length > 0) {
        const firstChoice = result[0];
        if (firstChoice.choices && firstChoice.choices.length > 0) {
          cleanContent = firstChoice.choices[0].message.content || "";
        }
      }
      
      // Convert markdown to HTML formatting
      cleanContent = cleanContent
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')  // Bold **text**
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')              // Italic *text*
        .replace(/#{1,6}\s*([^\n]+)/g, '<h3>$1</h3>')        // Headers to h3
        .replace(/```[\s\S]*?```/g, '')                      // Remove code blocks
        .replace(/`([^`]+)`/g, '<code>$1</code>')            // Inline code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')             // Remove links, keep text
        .replace(/^\s*[-*+]\s+(.+)/gm, '• $1')               // Convert bullet points
        .replace(/^\s*\d+\.\s+(.+)/gm, '$1')                 // Remove numbered list numbers
        .replace(/\n\s*\n/g, '\n\n')                         // Normalize line breaks
        .replace(/\n/g, '<br>')                              // Convert newlines to HTML breaks
        .trim();

      return NextResponse.json({ generated: cleanContent });
    } catch {
      console.error("❌ Webhook response was not JSON:", text);
      return NextResponse.json(
        { error: "Invalid JSON returned from webhook" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    const message =
      error.name === "AbortError"
        ? "Request to webhook timed out"
        : error.message || "Failed to post to webhook";

    console.error("❌ Webhook error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
