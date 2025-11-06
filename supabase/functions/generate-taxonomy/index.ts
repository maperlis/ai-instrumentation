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
    const { url, imageData, videoData, productDetails, mode = 'metrics', selectedMetrics } = await req.json();
    console.log("Mode:", mode, "hasUrl:", !!url, "hasImage:", !!imageData, "hasVideo:", !!videoData);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    let systemPrompt: string;
    
    if (mode === 'metrics') {
      systemPrompt = `You are a product analytics specialist. Analyze the product and recommend 5-8 key metrics that should be measured.

Group metrics by category (Acquisition, Engagement, Retention, Monetization, Product Usage).

Return ONLY a valid JSON object with this exact structure:
{
  "metrics": [
    {
      "id": "conversion_rate",
      "name": "Conversion Rate",
      "description": "Percentage of users who complete key actions like signup or purchase",
      "category": "Acquisition",
      "example_events": ["signup_completed", "purchase_completed", "trial_started"]
    }
  ]
}`;
    } else {
      systemPrompt = `You are an expert product analytics instrumentation specialist. Generate a comprehensive event taxonomy optimized for measuring these metrics: ${selectedMetrics?.join(', ')}.

Follow these principles:
- Use snake_case for all event names
- Follow the pattern: product_area_action_object
- Focus on events that directly support the selected metrics
- Generate appropriate event properties for context
- Assign confidence scores based on clarity of the UI element
- Assign owners based on product area

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
    }

    const userContent = [];

    if (url) {
      userContent.push({
        type: "text",
        text: mode === 'metrics'
          ? `Analyze this product URL and recommend key metrics:\n\nURL: ${url}${
              productDetails ? `\n\nProduct Context: ${productDetails}` : ""
            }`
          : `Generate an instrumentation taxonomy for this product URL:\n\nURL: ${url}${
              productDetails ? `\n\nProduct Context: ${productDetails}` : ""
            }\n\nFocus on events for: ${selectedMetrics?.join(', ')}`,
      });
    } else if (imageData) {
      userContent.push({
        type: "text",
        text: mode === 'metrics'
          ? `Analyze this product design and recommend key metrics.${
              productDetails ? `\n\nProduct Context: ${productDetails}` : ""
            }`
          : `Generate an instrumentation taxonomy for this product design.${
              productDetails ? `\n\nProduct Context: ${productDetails}` : ""
            }\n\nFocus on events for: ${selectedMetrics?.join(', ')}`,
      });
      userContent.push({
        type: "image_url",
        image_url: {
          url: imageData,
        },
      });
    } else if (videoData) {
      userContent.push({
        type: "text",
        text: mode === 'metrics'
          ? `Analyze this product demo video and recommend key metrics based on the features shown.${
              productDetails ? `\n\nProduct Context: ${productDetails}` : ""
            }`
          : `Generate an instrumentation taxonomy for this product demo video. Focus on user interactions and workflows shown in the video.${
              productDetails ? `\n\nProduct Context: ${productDetails}` : ""
            }\n\nFocus on events for: ${selectedMetrics?.join(', ')}`,
      });
      userContent.push({
        type: "image_url",
        image_url: {
          url: videoData,
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
