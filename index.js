#!/usr/bin/env node
/**
 * Vision Analyze MCP Server
 * Wraps OpenRouter API (Gemini) for image analysis
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

// --- Config ---
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const DEFAULT_MODEL = process.env.VISION_MODEL || "google/gemini-2.5-flash-lite";
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

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
  return `data:${mime};base64,${base64}`;
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
    throw new Error(`Failed to download image: ${resp.status} ${resp.statusText}`);
  }
  const contentType = resp.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await resp.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  // Extract just the mime type (before any semicolon)
  const mime = contentType.split(";")[0].trim();
  return `data:${mime};base64,${base64}`;
}

function resolveImageSource(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") {
    throw new Error("image_url is required");
  }

  const src = imageUrl.trim();

  // Already a data URL
  if (src.startsWith("data:")) {
    return src;
  }

  // HTTP(S) URL — download
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return downloadImageAsBase64(src);
  }

  // Local file path
  return Promise.resolve(fileToBase64DataUrl(src));
}

async function callOpenRouterVision(imageDataUrl, prompt, model) {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "OPENROUTER_API_KEY not set. Add it to ~/.pi/agent/mcp-servers/vision-analyze/.env"
    );
  }

  const body = {
    model: model || DEFAULT_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: imageDataUrl },
          },
        ],
      },
    ],
    max_tokens: 4096,
  };

  const resp = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://pi-agent.local",
      "X-Title": "Pi Vision Analyze MCP",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "unknown error");
    throw new Error(`OpenRouter API error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  const content =
    data?.choices?.[0]?.message?.content || "No analysis returned.";
  const usage = data?.usage || {};

  return {
    success: true,
    analysis: content,
    model: data?.model || model || DEFAULT_MODEL,
    usage: {
      prompt_tokens: usage.prompt_tokens || 0,
      completion_tokens: usage.completion_tokens || 0,
      total_tokens: usage.total_tokens || 0,
    },
  };
}

// --- MCP Server ---

const server = new Server(
  { name: "vision-analyze", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "vision_analyze",
      description:
        "Analyze an image using AI vision (Gemini via OpenRouter). Accepts local file paths or HTTP(S) URLs. Returns a detailed text analysis of the image content.",
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
              "What to analyze or ask about the image. E.g. 'Describe this screenshot', 'What error is shown?', 'Extract all text from this image'",
          },
          model: {
            type: "string",
            description: `OpenRouter model to use (default: ${DEFAULT_MODEL}). Options: google/gemini-2.5-flash-lite, google/gemini-3-flash-preview, google/gemini-3.1-flash-lite`,
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
      const { image_url, prompt, model } = args;

      if (!image_url) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "image_url is required",
              }),
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

      // Resolve image to base64 data URL
      const imageDataUrl = await resolveImageSource(image_url);

      // Call vision API
      const result = await callOpenRouterVision(imageDataUrl, prompt, model);

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
            text: JSON.stringify({
              success: false,
              error: err.message,
            }),
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
console.error("vision-analyze MCP server started");
