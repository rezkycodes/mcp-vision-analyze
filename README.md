# 🔍 MCP Vision Analyze

A lightweight [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for AI image vision analysis. Powered by **OpenRouter** (Google Gemini, Grok, and more).

**Works with:** Claude Desktop, Claude Code CLI, Antigravity, Cursor, Pi Agent, Windsurf, Cline, VS Code, and any MCP-compatible client.

---

## ✨ Features

- 🖼️ Analyze images from **local file paths** or **HTTP(S) URLs**
- 🧠 Powered by **Google Gemini** models via OpenRouter
- 💰 Ultra cheap — ~**$0.0001** per image (free tier available)
- 📝 Extract text from screenshots (OCR)
- 🐛 Diagnose error messages in screenshots
- 📊 Analyze charts, diagrams, and UI designs
- 🚀 No rate limits — production ready
- 🔒 Secure — API keys stay local, never stored externally

---

## 📦 Pricing (OpenRouter)

| Model | Input | Output | Best For |
|-------|-------|--------|----------|
| `google/gemini-2.5-flash-lite` | $0.10/M tokens | $0.40/M tokens | **Default — cheapest** |
| `google/gemini-3.1-flash-lite` | $0.25/M tokens | $1.50/M tokens | Better quality |
| `google/gemini-3-flash-preview` | $0.50/M tokens | $3.00/M tokens | Best reasoning |
| `google/gemini-3.7-flash` | $0.38/M tokens | $1.88/M tokens | Latest model |
| `x-ai/grok-4.5` | $2.00/M tokens | $6.00/M tokens | Grok vision |

> 💡 1 image analysis ≈ 1,300 input tokens + 150 output tokens ≈ **$0.0001**
> 💡 Free tier available — no credit card needed to start

---

## 🚀 Quick Start

### 1. Get an API Key

Sign up at [OpenRouter](https://openrouter.ai/) and get your API key from [openrouter.ai/keys](https://openrouter.ai/keys).

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

Choose your client below. Set `OPENROUTER_API_KEY` in the `env` block.

#### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "vision-analyze": {
      "command": "npx",
      "args": ["-y", "mcp-vision-analyze"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-your-openrouter-key"
      }
    }
  }
}
```

#### Claude Code CLI

```bash
claude mcp add vision-analyze \
  -e OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key \
  -- npx -y mcp-vision-analyze

# Or add to .mcp.json in your project root
```

Or add to `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "vision-analyze": {
      "command": "npx",
      "args": ["-y", "mcp-vision-analyze"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-your-openrouter-key"
      }
    }
  }
}
```

#### Antigravity

Add via Settings → MCP, or edit `~/.gemini/antigravity/mcp_config.json`:

```json
{
  "mcpServers": {
    "vision-analyze": {
      "command": "npx",
      "args": ["-y", "mcp-vision-analyze"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-your-openrouter-key"
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
        "OPENROUTER_API_KEY": "sk-or-v1-your-openrouter-key"
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
        "OPENROUTER_API_KEY": "sk-or-v1-your-openrouter-key"
      }
    }
  }
}
```

#### OpenCode (`~/.config/opencode/opencode.json`)

```json
{
  "mcp": {
    "vision-analyze": {
      "type": "local",
      "command": ["node", "/path/to/index.js"],
      "environment": {
        "OPENROUTER_API_KEY": "sk-or-v1-your-openrouter-key"
      },
      "enabled": true
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

### Use a Different Model

```json
{
  "image_url": "/path/to/image.png",
  "prompt": "Analyze this chart",
  "model": "google/gemini-3-flash-preview"
}
```

### Use Grok Vision

```json
{
  "image_url": "/path/to/image.png",
  "prompt": "Describe this image",
  "model": "x-ai/grok-4.5"
}
```

---

## 📁 Project Structure

```
mcp-vision-analyze/
├── index.js            # MCP server (OpenRouter only)
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
| `VISION_PROVIDER` | No | `openrouter` | Provider (only `openrouter` supported) |
| `OPENROUTER_API_KEY` | ✅ Yes | — | OpenRouter API key |
| `OPENROUTER_MODEL` | No | `google/gemini-2.5-flash-lite` | OpenRouter model |

---

## 📦 Available Models

| Model | Cost (input/output per M) | Quality |
|-------|---------------------------|---------|
| `google/gemini-2.5-flash-lite` | $0.10 / $0.40 | ⭐⭐⭐⭐ Best value |
| `google/gemini-3.1-flash-lite` | $0.25 / $1.50 | ⭐⭐⭐⭐ Great |
| `google/gemini-3-flash-preview` | $0.50 / $3.00 | ⭐⭐⭐⭐⭐ Best |
| `google/gemini-3.7-flash` | $0.38 / $1.88 | ⭐⭐⭐⭐⭐ Latest |
| `x-ai/grok-4.5` | $2.00 / $6.00 | ⭐⭐⭐⭐ Grok |

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

### How much does it cost?

~$0.0001 per image analysis. Free tier available — no credit card needed.

### Can I use Grok for vision?

Yes! Set `model: "x-ai/grok-4.5"`. Grok is not free on OpenRouter.

### Does it work offline?

No. Internet connection required for API calls.

### Is my image data stored?

No. Images are processed in-memory and sent directly to OpenRouter. Nothing is stored on disk.

---

## 📄 License

MIT

---

## 🙏 Credits

Inspired by the `vision_analyze` tool from [Hermes Agent](https://github.com/nicepkg/hermes).
