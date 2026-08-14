# 🔍 MCP Vision Analyze

A lightweight [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for AI image vision analysis. Supports **two providers**:

| Provider | Cost | Rate Limit | Best For |
|----------|------|------------|----------|
| **Google AI Studio** | 🆓 **FREE** | 15-30 RPM | Personal use, testing |
| **OpenRouter** | ~$0.0001/image | Unlimited | Production, high volume |

**Works with:** Claude Desktop, Claude Code CLI, Antigravity, Cursor, Pi Agent, Windsurf, Cline, VS Code, and any MCP-compatible client.

---

## ✨ Features

- 🖼️ Analyze images from **local file paths** or **HTTP(S) URLs**
- 🧠 Powered by **Google Gemini** models (2.5 Flash, 2.5 Flash Lite, etc.)
- 💰 **FREE** with Google AI Studio or ~$0.0001/image with OpenRouter
- 📝 Extract text from screenshots (OCR)
- 🐛 Diagnose error messages in screenshots
- 📊 Analyze charts, diagrams, and UI designs
- 🔒 Secure — API keys stay local, never stored externally
- 🔄 Auto-fallback: use `auto` provider to prefer free Google first

---

## 🚀 Quick Start

### 1. Get an API Key (pick one)

**Option A — Google AI Studio (FREE):**
1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Create API key
3. Free tier: 15-30 requests per minute

**Option B — OpenRouter (cheap):**
1. Sign up at [openrouter.ai](https://openrouter.ai/)
2. Get key at [openrouter.ai/keys](https://openrouter.ai/keys)
3. Add credits (even $1 lasts for ~10,000 images)

### 2. Install

```bash
# Option A: Use directly with npx (recommended)
npx mcp-vision-analyze

# Option B: Clone and install manually
git clone https://github.com/rezkycodes/mcp-vision-analyze.git
cd mcp-vision-analyze
npm install
```

### 3. Configure Your MCP Client

Choose your client below. Set **one or both** API keys in the `env` block.

---

#### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "vision-analyze": {
      "command": "npx",
      "args": ["-y", "mcp-vision-analyze"],
      "env": {
        "VISION_PROVIDER": "auto",
        "GOOGLE_API_KEY": "your-google-key",
        "OPENROUTER_API_KEY": "sk-or-v1-your-openrouter-key"
      }
    }
  }
}
```

#### Claude Code CLI

```bash
# Add with both providers (auto-fallback)
claude mcp add vision-analyze \
  -e VISION_PROVIDER=auto \
  -e GOOGLE_API_KEY=your-google-key \
  -e OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key \
  -- npx -y mcp-vision-analyze

# Or add only Google (FREE)
claude mcp add vision-analyze \
  -e VISION_PROVIDER=google \
  -e GOOGLE_API_KEY=your-google-key \
  -- npx -y mcp-vision-analyze
```

Or add to `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "vision-analyze": {
      "command": "npx",
      "args": ["-y", "mcp-vision-analyze"],
      "env": {
        "VISION_PROVIDER": "auto",
        "GOOGLE_API_KEY": "your-google-key",
        "OPENROUTER_API_KEY": "sk-or-v1-your-openrouter-key"
      }
    }
  }
}
```

#### Antigravity

Add via Settings → MCP, or edit the config file:

```json
{
  "mcpServers": {
    "vision-analyze": {
      "command": "npx",
      "args": ["-y", "mcp-vision-analyze"],
      "env": {
        "VISION_PROVIDER": "google",
        "GOOGLE_API_KEY": "your-google-key"
      }
    }
  }
}
```

#### Pi Agent (`~/.pi/agent/mcp.json`)

```json
{
  "vision-analyze": {
    "transport": "stdio",
    "command": "npx",
    "args": ["-y", "mcp-vision-analyze"],
    "env": {
      "VISION_PROVIDER": "auto",
      "GOOGLE_API_KEY": "your-google-key",
      "OPENROUTER_API_KEY": "sk-or-v1-your-openrouter-key"
    },
    "directTools": true
  }
}
```

#### Cursor (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "vision-analyze": {
      "command": "npx",
      "args": ["-y", "mcp-vision-analyze"],
      "env": {
        "VISION_PROVIDER": "auto",
        "GOOGLE_API_KEY": "your-google-key"
      }
    }
  }
}
```

#### VS Code (`~/.config/Code/User/mcp.json`)

```json
{
  "servers": {
    "vision-analyze": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-vision-analyze"],
      "env": {
        "VISION_PROVIDER": "auto",
        "GOOGLE_API_KEY": "your-google-key"
      }
    }
  }
}
```

---

## 🛠️ Usage

Once configured, the `vision_analyze` tool becomes available:

### Basic — Analyze a Screenshot

```json
{
  "image_url": "/path/to/screenshot.png",
  "prompt": "What is shown in this screenshot?"
}
```

### Extract Text (OCR)

```json
{
  "image_url": "/path/to/photo.png",
  "prompt": "Extract all text from this image"
}
```

### Diagnose an Error

```json
{
  "image_url": "/path/to/error.png",
  "prompt": "What error is shown and how to fix it?"
}
```

### Force a Specific Provider

```json
{
  "image_url": "/path/to/image.png",
  "prompt": "Analyze this chart",
  "provider": "google",
  "model": "gemini-2.5-flash"
}
```

### Use Grok Vision (via OpenRouter)

```json
{
  "image_url": "/path/to/image.png",
  "prompt": "Describe this image",
  "provider": "openrouter",
  "model": "x-ai/grok-4.5"
}
```

---

## 📁 Project Structure

```
mcp-vision-analyze/
├── index.js            # MCP server (supports Google + OpenRouter)
├── package.json        # npm metadata
├── .env.example        # Config template
├── .env                # Your API keys (git-ignored)
├── .gitignore          # Git ignore rules
├── LICENSE             # MIT
└── README.md           # This file
```

---

## 🔧 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VISION_PROVIDER` | No | `auto` | Provider: `google`, `openrouter`, or `auto` |
| `GOOGLE_API_KEY` | One of both | — | Google AI Studio API key (FREE) |
| `OPENROUTER_API_KEY` | One of both | — | OpenRouter API key (paid) |
| `GOOGLE_MODEL` | No | `gemini-2.5-flash` | Google model |
| `OPENROUTER_MODEL` | No | `google/gemini-2.5-flash-lite` | OpenRouter model |

**Provider logic:**
- `auto` → Use Google if `GOOGLE_API_KEY` is set, else OpenRouter
- `google` → Force Google AI Studio
- `openrouter` → Force OpenRouter

---

## 📦 Available Models

### Google AI Studio (FREE)

| Model | Speed | Quality |
|-------|-------|---------|
| `gemini-2.5-flash` | Fast | ⭐⭐⭐⭐⭐ Best |
| `gemini-2.5-flash-lite` | Fastest | ⭐⭐⭐⭐ Great |
| `gemini-2.0-flash` | Fast | ⭐⭐⭐⭐ Good |
| `gemini-1.5-flash` | Fastest | ⭐⭐⭐ OK |

### OpenRouter (paid)

| Model | Cost (input/output) | Quality |
|-------|---------------------|---------|
| `google/gemini-2.5-flash-lite` | $0.10/$0.40 per M | ⭐⭐⭐⭐ Best value |
| `google/gemini-3-flash-preview` | $0.50/$3.00 per M | ⭐⭐⭐⭐⭐ Best |
| `google/gemini-3.7-flash` | $0.38/$1.88 per M | ⭐⭐⭐⭐⭐ Latest |
| `x-ai/grok-4.5` | $2.00/$6.00 per M | ⭐⭐⭐⭐ Grok |

> 💡 With Google AI Studio: **completely FREE** (15-30 RPM limit)
> 💡 With OpenRouter: ~**$0.0001** per image analysis

---

## 🤝 Supported Image Formats

- JPEG / JPG
- PNG
- GIF
- WebP
- BMP (auto-converted)
- SVG (auto-rasterized)

---

## ❓ FAQ

### Which provider should I use?

- **Personal/testing:** Use `google` — it's free!
- **Production/high-volume:** Use `openrouter` — no rate limits
- **Both:** Use `auto` — prefers free Google, falls back to OpenRouter

### Is Google AI Studio really free?

Yes! Google offers Gemini API free with rate limits (15-30 requests per minute). Perfect for personal use.

### Can I use Grok for vision?

Yes! Via OpenRouter: set `provider: "openrouter"` and `model: "x-ai/grok-4.5"`. Note: Grok is not free on OpenRouter.

### Does it work offline?

No. Internet connection required for API calls.

### Is my image data stored?

No. Images are processed in-memory and sent directly to the API. Nothing is stored on disk.

---

## 📄 License

MIT

---

## 🙏 Credits

Inspired by the `vision_analyze` tool from [Hermes Agent](https://github.com/nicepkg/hermes).
