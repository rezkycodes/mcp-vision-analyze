#!/usr/bin/env node
/**
 * Vision Analyze MCP Server
 * Supports TWO providers for image analysis:
 *   1. Google AI Studio — FREE (rate limited: 15-30 RPM)
 *   2. OpenRouter — PAID but cheap (~$0.0001/image)
 *
 * Inspired by Hermes vision_analyze tool
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// --- Load .env from script directory ---
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

// --- Provider Config ---
const PROVIDER = (process.env.VISION_PROVIDER || "google").toLowerCase(); // "google" | "openrouter"
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const GOOGLE_MODEL = process.env.GOOGLE_MODEL || "gemini-2.5-flash";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash-lite";

// --- Helpers ---

function detectMimeType(filePath) {
  const ext = filePath.toLowerCase().split(".").pop();
  const mimeMap = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    svg: "image/svg+xml",
  };
  return mimeMap[ext] || "image/jpeg";
}

function fileToBase64DataUrl(filePath) {
  const absPath = resolve(filePath);
  if (!existsSync(absPath)) {
    throw new Error(`File not found: ${absPath}`);
  }
  const buffer = readFileSync(absPath);
  const mime = detectMimeType(absPath);
  const base64 = buffer.toString("base64");
  return { dataUrl: `data:${mime};base64,${base64}`, mime, base64 };
}

async function downloadImageAsBase64(url) {
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      Accept: "image/*,*/*;q=0.8",
    },
    redirect: "follow",
  });
  if (!resp.ok) {
    throw new Error(
      `Failed to download image: ${resp.status} ${resp.statusText}`
    );
  }
  const contentType = resp.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await resp.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mime = contentType.split(";")[0].trim();
  return { dataUrl: `data:${mime};base64,${base64}`, mime, base64 };
}

async function resolveImageSource(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") {
    throw new Error("image_url is required");
  }
  const src = imageUrl.trim();
  if (src.startsWith("data:")) {
    const match = src.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid data URL format");
    return { dataUrl: src, mime: match[1], base64: match[2] };
  }
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return downloadImageAsBase64(src);
  }
  return fileToBase64DataUrl(src);
}

// --- Google AI Studio Provider ---

async function callGoogleAIStudio(imageData, prompt, model) {
  if (!GOOGLE_API_KEY) {
    throw new Error(
      "GOOGLE_API_KEY not set. Get free key at https://aistudio.google.com/apikey"
    );
  }

  const modelName = model || GOOGLE_MODEL;
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GOOGLE_API_KEY}`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: imageData.mime,
              data: imageData.base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 4096,
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "unknown error");
    // Parse Google error for helpful message
    let errMsg = `Google AI Studio error ${resp.status}`;
    try {
      const errJson = JSON.parse(errText);
      errMsg += `: ${errJson?.error?.message || errText}`;
      // Rate limit hint
      if (resp.status === 429) {
        errMsg += "\n💡 Rate limit hit. Wait a minute or switch to OpenRouter provider.";
      }
    } catch {
      errMsg += `: ${errText.slice(0, 200)}`;
    }
    throw new Error(errMsg);
  }

  const data = await resp.json();
  const content =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis returned.";
  const usage = data?.usageMetadata || {};

  return {
    success: true,
    analysis: content,
    provider: "google-ai-studio",
    model: modelName,
    usage: {
      prompt_tokens: usage.promptTokenCount || 0,
      completion_tokens: usage.candidatesTokenCount || 0,
      total_tokens: usage.totalTokenCount || 0,
    },
    cost: "FREE",
  };
}

// --- OpenRouter Provider ---

async function callOpenRouter(imageData, prompt, model) {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "OPENROUTER_API_KEY not set. Get key at https://openrouter.ai/keys"
    );
  }

  const modelId = model || OPENROUTER_MODEL;
  const body = {
    model: modelId,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: imageData.dataUrl },
          },
        ],
      },
    ],
    max_tokens: 4096,
  };

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/rezkycodes/mcp-vision-analyze",
      "X-Title": "MCP Vision Analyze",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "unknown error");
    throw new Error(`OpenRouter API error ${resp.status}: ${errText.slice(0, 200)}`);
  }

  const data = await resp.json();
  const content =
    data?.choices?.[0]?.message?.content || "No analysis returned.";
  const usage = data?.usage || {};
  const cost = data?.usage?.cost || 0;

  return {
    success: true,
    analysis: content,
    provider: "openrouter",
    model: data?.model || modelId,
    usage: {
      prompt_tokens: usage.prompt_tokens || 0,
      completion_tokens: usage.completion_tokens || 0,
      total_tokens: usage.total_tokens || 0,
    },
    cost: cost ? `$${cost.toFixed(6)}` : "unknown",
  };
}

// --- Unified Router ---

async function analyzeImage(imageData, prompt, model, provider) {
  const prov = (provider || PROVIDER).toLowerCase();

  if (prov === "google" || prov === "google-studio" || prov === "gemini") {
    return callGoogleAIStudio(imageData, prompt, model);
  }

  if (prov === "openrouter" || prov === "open-router") {
    return callOpenRouter(imageData, prompt, model);
  }

  // Auto-detect: prefer Google if key exists, else OpenRouter
  if (prov === "auto") {
    if (GOOGLE_API_KEY) return callGoogleAIStudio(imageData, prompt, model);
    if (OPENROUTER_API_KEY) return callOpenRouter(imageData, prompt, model);
    throw new Error("No API key set. Set GOOGLE_API_KEY or OPENROUTER_API_KEY in .env");
  }

  throw new Error(
    `Unknown provider: "${prov}". Use "google" or "openrouter"`
  );
}

// --- MCP Server ---

const server = new Server(
  { name: "vision-analyze", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

const availableModels = {
  google: [
    "gemini-2.5-flash (FREE, recommended)",
    "gemini-2.5-flash-lite (FREE, fastest)",
    "gemini-2.0-flash (FREE)",
    "gemini-1.5-flash (FREE)",
  ],
  openrouter: [
    "google/gemini-2.5-flash-lite ($0.10/M, cheapest)",
    "google/gemini-3-flash-preview ($0.50/M, best value)",
    "google/gemini-3.7-flash ($0.38/M, latest)",
    "x-ai/grok-4.5 ($2/M, Grok vision)",
  ],
};

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "vision_analyze",
      description:
        "Analyze an image using AI vision. Supports two providers:\n" +
        '• Google AI Studio (FREE) — set GOOGLE_API_KEY\n' +
        '• OpenRouter (cheap) — set OPENROUTER_API_KEY\n\n' +
        "Accepts local file paths or HTTP(S) URLs. Returns detailed text analysis.",
      inputSchema: {
        type: "object",
        properties: {
          image_url: {
            type: "string",
            description:
              "Image source: local file path (/path/to/image.png) or HTTP(S) URL (https://example.com/image.jpg)",
          },
          prompt: {
            type: "string",
            description:
              "What to analyze or ask about the image. E.g. 'Describe this screenshot', 'What error is shown?', 'Extract all text'",
          },
          model: {
            type: "string",
            description:
              "Model to use. Google: gemini-2.5-flash, gemini-2.5-flash-lite. OpenRouter: google/gemini-2.5-flash-lite, x-ai/grok-4.5, etc.",
          },
          provider: {
            type: "string",
            enum: ["google", "openrouter", "auto"],
            description:
              'Provider to use. "google" = Google AI Studio (FREE), "openrouter" = OpenRouter (paid), "auto" = prefer Google if key exists. Default: env VISION_PROVIDER',
          },
        },
        required: ["image_url", "prompt"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "vision_analyze") {
    try {
      const { image_url, prompt, model, provider } = args;

      if (!image_url) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: false, error: "image_url is required" }),
            },
          ],
          isError: true,
        };
      }

      if (!prompt) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "prompt is required — tell me what to analyze in the image",
              }),
            },
          ],
          isError: true,
        };
      }

      // Resolve image
      const imageData = await resolveImageSource(image_url);

      // Call vision API
      const result = await analyzeImage(imageData, prompt, model, provider);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: err.message }),
          },
        ],
        isError: true,
      };
    }
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

// --- Start ---
const transport = new StdioServerTransport();
await server.connect(transport);

// Log active config
const activeProvider = PROVIDER === "auto"
  ? (GOOGLE_API_KEY ? "google-ai-studio" : OPENROUTER_API_KEY ? "openrouter" : "NONE")
  : PROVIDER;
console.error(`vision-analyze MCP server v2.0.0 started`);
console.error(`  Provider: ${activeProvider}`);
console.error(`  Google API Key: ${GOOGLE_API_KEY ? "✅ set" : "❌ not set"}`);
console.error(`  OpenRouter API Key: ${OPENROUTER_API_KEY ? "✅ set" : "❌ not set"}`);
