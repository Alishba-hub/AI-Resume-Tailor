import { NextRequest, NextResponse } from "next/server";

interface WebhookChoice {
  message: {
    content: string;
  };
}

interface WebhookResponse {
  choices: WebhookChoice[];
}

export async function POST(req: NextRequest) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);  
  
  try {
    const body = await req.json();
    const webhook = "https://primary-production-2bf5.up.railway.app/webhook/7b1fa002-9cdf-4d2e-845f-46e2ae2c9525";
    
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
      throw new Error(Webhook returned status ${response.status});
    }
    
    const text = await response.text();
    
    try {
      const result = JSON.parse(text) as WebhookResponse[];
      
      let cleanContent = "";
      if (result && Array.isArray(result) && result.length > 0) {
        const firstChoice = result[0];
        if (firstChoice.choices && firstChoice.choices.length > 0) {
          cleanContent = firstChoice.choices[0].message.content || "";
        }
      }
      
      // Clean and format the content
      cleanContent = cleanContent
        .replace(/\\([^]+)\\*/g, '<strong>$1</strong>')  
        .replace(/\([^]+)\*/g, '<em>$1</em>')             
        .replace(/#{1,6}\s*([^\n]+)/g, '<h3>$1</h3>')        
        .replace(/[\s\S]*?/g, '')                      
        .replace(/([^]+)`/g, '<code>$1</code>')            
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')            
        .replace(/^\s*[-*+]\s+(.+)/gm, '• $1')               
        .replace(/^\s*\d+\.\s+(.+)/gm, '$1')                 
        .replace(/\n\s*\n/g, '\n\n')                         
        .replace(/\n/g, '<br>')                              
        .trim();
        
      return NextResponse.json({ generated: cleanContent });
    } catch {
      console.error("❌ Webhook response was not JSON:", text);
      return NextResponse.json(
        { error: "Invalid JSON returned from webhook" },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Request to webhook timed out"
        : error instanceof Error
        ? error.message
        : "Failed to post to webhook";
        
    console.error("❌ Webhook error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
