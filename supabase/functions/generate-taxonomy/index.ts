import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, imageData, productDetails } = await req.json();
    console.log("Generating taxonomy for:", { hasUrl: !!url, hasImage: !!imageData });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are an expert product analytics instrumentation specialist. Your task is to analyze products (via URL or design images) and generate standardized event tracking taxonomies.

Follow these principles:
- Use snake_case for all event names
- Follow the pattern: product_area_action_object (e.g., homepage_view, signup_button_click)
- Identify all key user interactions: clicks, views, form submissions, navigation
- Generate appropriate event properties for context (e.g., device_type, source, referrer)
- Assign confidence scores based on clarity of the UI element
- Assign owners based on product area (e.g., PM_Acquisition, PM_Engagement)

Return ONLY a valid JSON object with this exact structure:
{
  "events": [
    {
      "event_name": "string",
      "description": "string",
      "trigger_action": "click|view|submit|scroll|etc",
      "screen": "string",
      "event_properties": ["array", "of", "strings"],
      "owner": "string",
      "notes": "string",
      "confidence": 0.0-1.0
    }
  ]
}`;

    const userContent = [];

    if (url) {
      userContent.push({
        type: "text",
        text: `Analyze this product URL and generate an instrumentation taxonomy:\n\nURL: ${url}${
          productDetails ? `\n\nProduct Context: ${productDetails}` : ""
        }\n\nIdentify all key user interactions and generate events.`,
      });
    } else if (imageData) {
      userContent.push({
        type: "text",
        text: `Analyze this product design image and generate an instrumentation taxonomy.${
          productDetails ? `\n\nProduct Context: ${productDetails}` : ""
        }\n\nIdentify all UI elements and user interactions visible in the design.`,
      });
      userContent.push({
        type: "image_url",
        image_url: {
          url: imageData,
        },
      });
    }

    console.log("Calling AI API with model: google/gemini-2.5-flash");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    console.log("AI response received");

    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    const result = JSON.parse(content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in generate-taxonomy:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to generate taxonomy",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
