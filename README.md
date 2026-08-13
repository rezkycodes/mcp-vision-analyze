# 🔍 MCP Vision Analyze

A lightweight [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that provides AI vision analysis capabilities. Analyze images using Google's Gemini models via [OpenRouter](https://openrouter.ai/).

**Works with:** Claude Desktop, Claude Code CLI, Antigravity, Cursor, Pi Agent, Windsurf, Cline, VS Code, and any MCP-compatible client.

---

## ✨ Features

- 🖼️ Analyze images from **local file paths** or **HTTP(S) URLs**
- 🧠 Powered by **Google Gemini** models (2.5 Flash Lite, 3 Flash Preview, etc.)
- 💰 Ultra cheap — ~**$0.001** per image with Gemini 2.5 Flash Lite
- 📝 Extract text from screenshots (OCR)
- 🐛 Diagnose error messages in screenshots
- 📊 Analyze charts, diagrams, and UI designs
- 🔒 Secure — API key stays local, never sent anywhere except OpenRouter

---

## 📦 Pricing (OpenRouter)

| Model | Input | Output | Best For |
|-------|-------|--------|----------|
| `google/gemini-2.5-flash-lite` | $0.10/M tokens | $0.40/M tokens | **Default — cheapest** |
| `google/gemini-3.1-flash-lite` | $0.25/M tokens | $1.50/M tokens | Better quality |
| `google/gemini-3-flash-preview` | $0.50/M tokens | $3.00/M tokens | Best reasoning |
| `google/gemini-3.7-flash` | $0.38/M tokens | $1.88/M tokens | Latest model |

> 💡 1 image analysis ≈ 1,300 input tokens + 150 output tokens ≈ **$0.001**

---

## 🚀 Quick Start

### 1. Get an API Key

Sign up at [OpenRouter](https://openrouter.ai/) and get your API key from [openrouter.ai/keys](https://openrouter.ai/keys).

### 2. Install

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/mcp-vision-analyze.git
cd mcp-vision-analyze

# Install dependencies
npm install

# Copy env example and add your API key
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY
```

### 3. Configure Your MCP Client

#### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "vision-analyze": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-vision-analyze/index.js"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-your-key-here"
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
    "command": "node",
    "args": ["/absolute/path/to/mcp-vision-analyze/index.js"],
    "env": {
      "OPENROUTER_API_KEY": "sk-or-v1-your-key-here"
    },
    "directTools": true
  }
}
```

#### Claude Code CLI

```bash
# Option 1: Using the CLI command
claude mcp add vision-analyze \
  -e OPENROUTER_API_KEY=sk-or-v1-your-key-here \
  -- node /absolute/path/to/mcp-vision-analyze/index.js

# Option 2: Using JSON config
claude mcp add-json vision-analyze '{
  "command": "node",
  "args": ["/absolute/path/to/mcp-vision-analyze/index.js"],
  "env": {
    "OPENROUTER_API_KEY": "sk-or-v1-your-key-here"
  }
}'
```

Or add to `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "vision-analyze": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-vision-analyze/index.js"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-your-key-here"
      }
    }
  }
}
```

#### Antigravity

Add to `~/.config/Antigravity/User/globalStorage/*/mcp.json` or via Antigravity Settings → MCP:

```json
{
  "mcpServers": {
    "vision-analyze": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-vision-analyze/index.js"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-your-key-here"
      }
    }
  }
}
```

#### Cursor (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "vision-analyze": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-vision-analyze/index.js"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-your-key-here"
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
      "command": "node",
      "args": ["/absolute/path/to/mcp-vision-analyze/index.js"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-your-key-here"
      }
    }
  }
}
```

#### Cline / Windsurf / Other MCP Clients

Add the server config with:
- **command:** `node`
- **args:** `["/path/to/index.js"]`
- **env:** `{ "OPENROUTER_API_KEY": "your-key" }`

---

## 🛠️ Usage

Once configured, the `vision_analyze` tool becomes available in your MCP client:

### Analyze a Screenshot

```json
{
  "image_url": "/path/to/screenshot.png",
  "prompt": "What is shown in this screenshot?"
}
```

### Analyze an Image from URL

```json
{
  "image_url": "https://example.com/image.jpg",
  "prompt": "Describe the architectural style of this building"
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
  "image_url": "/path/to/error-screenshot.png",
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

---

## 📁 Project Structure

```
mcp-vision-analyze/
├── index.js            # MCP server main file
├── package.json        # Node.js dependencies
├── .env.example        # Environment variables template
├── .env                # Your API key (git-ignored)
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

---

## 🔧 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | ✅ Yes | — | Your OpenRouter API key |
| `VISION_MODEL` | No | `google/gemini-2.5-flash-lite` | Gemini model to use |

---

## 🤝 Supported Image Formats

- JPEG / JPG
- PNG
- GIF
- WebP
- BMP (auto-converted to PNG)
- SVG (auto-rasterized to PNG)

---

## ❓ FAQ

### Is this free?

The MCP server itself is free and open-source. The Gemini models on OpenRouter are paid but very cheap (~$0.001 per image).

### Can I use other models besides Gemini?

Currently supports OpenRouter models. You can change `VISION_MODEL` to any model available on OpenRouter that supports vision (GPT-4o, Claude, etc.).

### Does it work offline?

No. It requires an internet connection to call the OpenRouter API.

### Is my image data stored anywhere?

No. Images are processed in-memory and sent directly to OpenRouter's API. Nothing is stored on disk (except temporary files that are auto-cleaned).

---

## 📄 License

MIT

---

## 🙏 Credits

Inspired by the `vision_analyze` tool from [Hermes Agent](https://github.com/nicepkg/hermes).
