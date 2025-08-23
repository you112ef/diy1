# bolt.diy

[![bolt.diy: AI-Powered Full-Stack Web Development in the Browser](./public/social_preview_index.jpg)](https://bolt.diy)

Welcome to bolt.diy, the official open source version of Bolt.new, which allows you to choose the LLM that you use for each prompt! Currently, you can use OpenAI, Anthropic, Ollama, OpenRouter, Gemini, LMStudio, Mistral, xAI, HuggingFace, DeepSeek, or Groq models - and it is easily extended to use any other model supported by the Vercel AI SDK! See the instructions below for running this locally and extending it to include more models.

-----
Check the [bolt.diy Docs](https://stackblitz-labs.github.io/bolt.diy/) for more offical installation instructions and more informations.

-----
Also [this pinned post in our community](https://thinktank.ottomator.ai/t/videos-tutorial-helpful-content/3243) has a bunch of incredible resources for running and deploying bolt.diy yourself!

We have also launched an experimental agent called the "bolt.diy Expert" that can answer common questions about bolt.diy. Find it here on the [oTTomator Live Agent Studio](https://studio.ottomator.ai/).

bolt.diy was originally started by [Cole Medin](https://www.youtube.com/@ColeMedin) but has quickly grown into a massive community effort to build the BEST open source AI coding assistant!

## Quick Start

**⚡ Want to get started fast?** See [QUICKSTART.md](./QUICKSTART.md) for a 5-minute setup guide!

### Ollama Integration

**🤖 Want to use local AI models?** See [OLLAMA_SETUP.md](./OLLAMA_SETUP.md) for complete Ollama setup!

**⚡ Quick start**: [QUICKSTART_OLLAMA.md](./QUICKSTART_OLLAMA.md) for 3-minute setup!

**🔧 Having issues?** See [TROUBLESHOOTING_OLLAMA.md](./TROUBLESHOOTING_OLLAMA.md) for solutions!

**🚀 Want maximum performance?** See [OLLAMA_PERFORMANCE.md](./OLLAMA_PERFORMANCE.md) for optimization!

```bash
# Quick Ollama setup
npm run ollama:install     # Simple installation (recommended)
npm run ollama:setup       # Advanced setup (native)
npm run ollama:docker      # Docker setup
npm run ollama:status      # Check status
npm run ollama:test        # Test installation
```

## Table of Contents

- [Quick Start](#quick-start)
- [Ollama Integration](#ollama-integration)
- [Join the Community](#join-the-community)
- [Requested Additions](#requested-additions)
- [Features](#features)
- [Setup](#setup)
- [Run the Application](#run-the-application)
- [Available Scripts](#available-scripts)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [FAQ](#faq)

## Join the community

[Join the bolt.diy community here, in the oTTomator Think Tank!](https://thinktank.ottomator.ai)

## Project management

Bolt.diy is a community effort! Still, the core team of contributors aims at organizing the project in way that allows
you to understand where the current areas of focus are.

If you want to know what we are working on, what we are planning to work on, or if you want to contribute to the
project, please check the [project management guide](./PROJECT.md) to get started easily.

## Requested Additions

- ✅ OpenRouter Integration (@coleam00)
- ✅ Gemini Integration (@jonathands)
- ✅ Autogenerate Ollama models from what is downloaded (@yunatamos)
- ✅ Filter models by provider (@jasonm23)
- ✅ Download project as ZIP (@fabwaseem)
- ✅ Improvements to the main bolt.new prompt in `app\lib\.server\llm\prompts.ts` (@kofi-bhr)
- ✅ DeepSeek API Integration (@zenith110)
- ✅ Mistral API Integration (@ArulGandhi)
- ✅ "Open AI Like" API Integration (@ZerxZ)
- ✅ Ability to sync files (one way sync) to local folder (@muzafferkadir)
- ✅ Containerize the application with Docker for easy installation (@aaronbolton)
- ✅ Publish projects directly to GitHub (@goncaloalves)
- ✅ Ability to enter API keys in the UI (@ali00209)
- ✅ xAI Grok Beta Integration (@milutinke)
- ✅ LM Studio Integration (@karrot0)
- ✅ HuggingFace Integration (@ahsan3219)
- ✅ Bolt terminal to see the output of LLM run commands (@thecodacus)
- ✅ Streaming of code output (@thecodacus)
- ✅ Ability to revert code to earlier version (@wonderwhy-er)
- ✅ Chat history backup and restore functionality (@sidbetatester)
- ✅ Cohere Integration (@hasanraiyan)
- ✅ Dynamic model max token length (@hasanraiyan)
- ✅ Better prompt enhancing (@SujalXplores)
- ✅ Prompt caching (@SujalXplores)
- ✅ Load local projects into the app (@wonderwhy-er)
- ✅ Together Integration (@mouimet-infinisoft)
- ✅ Mobile friendly (@qwikode)
- ✅ Better prompt enhancing (@SujalXplores)
- ✅ Attach images to prompts (@atrokhym)(@stijnus)
- ✅ Added Git Clone button (@thecodacus)
- ✅ Git Import from url (@thecodacus)
- ✅ PromptLibrary to have different variations of prompts for different use cases (@thecodacus)
- ✅ Detect package.json and commands to auto install & run preview for folder and git import (@wonderwhy-er)
- ✅ Selection tool to target changes visually (@emcconnell)
- ✅ Detect terminal Errors and ask bolt to fix it (@thecodacus)
- ✅ Detect preview Errors and ask bolt to fix it (@wonderwhy-er)
- ✅ Add Starter Template Options (@thecodacus)
- ✅ Perplexity Integration (@meetpateltech)
- ✅ AWS Bedrock Integration (@kunjabijukchhe)
- ✅ Add a "Diff View" to see the changes (@toddyclipsgg)
- ⬜ **HIGH PRIORITY** - Prevent bolt from rewriting files as often (file locking and diffs)
- ⬜ **HIGH PRIORITY** - Better prompting for smaller LLMs (code window sometimes doesn't start)
- ⬜ **HIGH PRIORITY** - Run agents in the backend as opposed to a single model call
- ✅ Deploy directly to Netlify (@xKevIsDev)
- ⬜ Supabase Integration
- ⬜ Have LLM plan the project in a MD file for better results/transparency
- ⬜ VSCode Integration with git-like confirmations
- ⬜ Upload documents for knowledge - UI design templates, a code base to reference coding style, etc.
- ⬜ Voice prompting
- ⬜ Azure Open AI API Integration
- ⬜ Vertex AI Integration
- ⬜ Granite Integration
- ✅ Popout Window for Web Container(@stijnus)
- ✅ Ability to change Popout window size (@stijnus)

## Configuring API Keys and Providers

### Adding Your API Keys

There are two ways to configure your API keys:

#### Method 1: Environment Variables (Recommended)

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** and add your API keys:
   ```bash
   # OpenAI (GPT models)
   OPENAI_API_KEY=sk-your_openai_api_key_here
   
   # Anthropic (Claude models)
   ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key_here
   
   # Google (Gemini models)
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key_here
   
   # Add other keys as needed
   ```

3. **Restart the application** for changes to take effect

#### Method 2: UI Configuration

1. **Start the application** and open it in your browser
2. **Click the settings icon** (gear) in the sidebar
3. **Go to the "Providers" tab**
4. **Click "Edit"** next to the provider you want to configure
5. **Enter your API key** and click "Save"

### Supported Providers

Bolt.diy supports many AI providers out of the box:

| Provider | Models | Setup |
|----------|--------|-------|
| **OpenAI** | GPT-4, GPT-3.5 | Set `OPENAI_API_KEY` |
| **Anthropic** | Claude 3.5, Claude 3 Opus | Set `ANTHROPIC_API_KEY` |
| **Google** | Gemini 1.5, Gemini 2.0 | Set `GOOGLE_GENERATIVE_AI_API_KEY` |
| **Mistral** | Mistral 7B, Mixtral 8x7B | Set `MISTRAL_API_KEY` |
| **Cohere** | Command R+, Command R | Set `COHERE_API_KEY` |
| **DeepSeek** | DeepSeek Coder, DeepSeek Chat | Set `DEEPSEEK_API_KEY` |
| **Perplexity** | PPLX models | Set `PERPLEXITY_API_KEY` |
| **Together** | Various open models | Set `TOGETHER_API_KEY` |
| **Groq** | Fast inference models | Set `GROQ_API_KEY` |
| **OpenRouter** | Access to many models | Set `OPEN_ROUTER_API_KEY` |
| **xAI** | Grok models | Set `XAI_API_KEY` |
| **HuggingFace** | Open source models | Set `HUGGINGFACE_API_KEY` |
| **Amazon Bedrock** | AWS-hosted models | Set `AWS_BEDROCK_CONFIG` |
| **GitHub Copilot** | GitHub-hosted models | Set `GITHUB_API_KEY` |

### Local Models

For privacy and offline use, you can also run models locally:

| Provider | Setup |
|----------|-------|
| **Ollama** | Install Ollama, set `OLLAMA_API_BASE_URL=http://127.0.0.1:11434` |
| **LM Studio** | Install LM Studio, set `LM_STUDIO_API_BASE_URL=http://127.0.0.1:1234` |

### Custom Providers

You can add custom providers by:
1. Creating a new provider class in `app/lib/modules/llm/providers/`
2. Extending the `BaseProvider` class
3. Adding your provider to the registry in `app/lib/modules/llm/registry.ts`

## Features

- **AI-powered full-stack web development** for **NodeJS based applications** directly in your browser.
- **Support for multiple LLMs** with an extensible architecture to integrate additional models.
- **Attach images to prompts** for better contextual understanding.
- **Integrated terminal** to view output of LLM-run commands.
- **Revert code to earlier versions** for easier debugging and quicker changes.
- **Download projects as ZIP** for easy portability Sync to a folder on the host.
- **Integration-ready Docker support** for a hassle-free setup.
- **Deploy** directly to **Netlify**

## Setup

**📖 For detailed setup instructions, see [SETUP.md](./SETUP.md)**

### 1️⃣ Clone and Install

```bash
git clone https://github.com/stackblitz-labs/bolt.diy.git
cd bolt.diy
pnpm install
```

### 2️⃣ Environment Configuration

**Option A: Using .env.local file (Recommended for local development)**

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your API keys:
   ```bash
   # Required for OpenAI models (GPT-4, GPT-3.5)
   OPENAI_API_KEY=sk-your_openai_api_key_here
   
   # Required for Anthropic models (Claude)
   ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key_here
   
   # Required for Google models (Gemini)
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key_here
   
   # Add other API keys as needed for different providers
   ```

**Option B: Using Docker with environment variables**

```bash
docker run -p 5173:5173 --env-file .env.local bolt-ai:development
```

**Option C: Using Docker Compose**

```bash
docker compose --profile development up
```

### 3️⃣ Get API Keys

You'll need API keys from the providers you want to use:

- **OpenAI**: [Get API Key](https://platform.openai.com/api-keys)
- **Anthropic**: [Get API Key](https://console.anthropic.com/settings/keys)
- **Google**: [Get API Key](https://aistudio.google.com/app/apikey)
- **Mistral**: [Get API Key](https://console.mistral.ai/api-keys/)
- **Cohere**: [Get API Key](https://dashboard.cohere.com/api-keys)
- **DeepSeek**: [Get API Key](https://platform.deepseek.com/apiKeys)
- **Perplexity**: [Get API Key](https://www.perplexity.ai/settings/api)
- **Together**: [Get API Key](https://together.ai/settings/keys)
- **Groq**: [Get API Key](https://console.groq.com/keys)
- **OpenRouter**: [Get API Key](https://openrouter.ai/settings/keys)
- **xAI**: [Get API Key](https://x.ai/api)
- **HuggingFace**: [Get API Key](https://huggingface.co/settings/tokens)
- **Amazon Bedrock**: [Get Config](https://console.aws.amazon.com/iam/home)

### 4️⃣ Local Models (Optional)

For local models, you can also set up:

- **Ollama**: Install and run locally, then set `OLLAMA_API_BASE_URL=http://127.0.0.1:11434`
- **LM Studio**: Install and run locally, then set `LM_STUDIO_API_BASE_URL=http://127.0.0.1:1234`

## Run the Application

You have two options for running Bolt.DIY: directly on your machine or using Docker.

### Option 1: Direct Installation (Recommended for Beginners)

1. **Start the development server:**
   ```bash
   pnpm run dev
   ```

2. **Open your browser** and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

3. **Set up your API keys** in the UI:
   - Click on the settings icon (gear) in the sidebar
   - Go to the "Providers" tab
   - Enter your API keys for the providers you want to use
   - Or set them via environment variables in `.env.local`

### Option 2: Docker (Recommended for Advanced Users)

1. **Build the Docker image:**
   ```bash
   npm run dockerbuild
   ```

2. **Run with Docker Compose:**
   ```bash
   docker compose --profile development up
   ```

3. **Or run directly with Docker:**
   ```bash
   docker run -p 5173:5173 --env-file .env.local bolt-ai:development
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

### Troubleshooting

- **"API Key Required" message**: Make sure you've set the required API keys in `.env.local` or via the UI
- **Port already in use**: Change the port in the command or stop other services using port 5173
- **Docker issues**: Make sure Docker is running and you have sufficient permissions
- **API rate limits**: Some providers have rate limits; check their documentation for details

## Configuring API Keys and Providers

### Adding Your API Keys

There are two ways to configure your API keys:

#### Method 1: Environment Variables (Recommended)

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** and add your API keys:
   ```bash
   # OpenAI (GPT models)
   OPENAI_API_KEY=sk-your_openai_api_key_here
   
   # Anthropic (Claude models)
   ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key_here
   
   # Google (Gemini models)
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key_here
   
   # Add other keys as needed
   ```

3. **Restart the application** for changes to take effect

#### Method 2: UI Configuration

1. **Start the application** and open it in your browser
2. **Click the settings icon** (gear) in the sidebar
3. **Go to the "Providers" tab**
4. **Click "Edit"** next to the provider you want to configure
5. **Enter your API key** and click "Save"

### Supported Providers

Bolt.diy supports many AI providers out of the box:

| Provider | Models | Setup |
|----------|--------|-------|
| **OpenAI** | GPT-4, GPT-3.5 | Set `OPENAI_API_KEY` |
| **Anthropic** | Claude 3.5, Claude 3 Opus | Set `ANTHROPIC_API_KEY` |
| **Google** | Gemini 1.5, Gemini 2.0 | Set `GOOGLE_GENERATIVE_AI_API_KEY` |
| **Mistral** | Mistral 7B, Mixtral 8x7B | Set `MISTRAL_API_KEY` |
| **Cohere** | Command R+, Command R | Set `COHERE_API_KEY` |
| **DeepSeek** | DeepSeek Coder, DeepSeek Chat | Set `DEEPSEEK_API_KEY` |
| **Perplexity** | PPLX models | Set `PERPLEXITY_API_KEY` |
| **Together** | Various open models | Set `TOGETHER_API_KEY` |
| **Groq** | Fast inference models | Set `GROQ_API_KEY` |
| **OpenRouter** | Access to many models | Set `OPEN_ROUTER_API_KEY` |
| **xAI** | Grok models | Set `XAI_API_KEY` |
| **HuggingFace** | Open source models | Set `HUGGINGFACE_API_KEY` |
| **Amazon Bedrock** | AWS-hosted models | Set `AWS_BEDROCK_CONFIG` |
| **GitHub Copilot** | GitHub-hosted models | Set `GITHUB_API_KEY` |

### Local Models

For privacy and offline use, you can also run models locally:

| Provider | Setup |
|----------|-------|
| **Ollama** | Install Ollama, set `OLLAMA_API_BASE_URL=http://127.0.0.1:11434` |
| **LM Studio** | Install LM Studio, set `LM_STUDIO_API_BASE_URL=http://127.0.0.1:1234` |

### Custom Providers

You can add custom providers by:
1. Creating a new provider class in `app/lib/modules/llm/providers/`
2. Extending the `BaseProvider` class
3. Adding your provider to the registry in `app/lib/modules/llm/registry.ts`

## Setup Using Git (For Developers only)

This method is recommended for developers who want to:

- Contribute to the project
- Stay updated with the latest changes
- Switch between different versions
- Create custom modifications

#### Prerequisites

1. Install Git: [Download Git](https://git-scm.com/downloads)

#### Initial Setup

1. **Clone the Repository**:

   ```bash
   git clone -b stable https://github.com/stackblitz-labs/bolt.diy.git
   ```

2. **Navigate to Project Directory**:

   ```bash
   cd bolt.diy
   ```

3. **Install Dependencies**:

   ```bash
   pnpm install
   ```

4. **Start the Development Server**:
   ```bash
   pnpm run dev
   ```

5. **(OPTIONAL)** Switch to the Main Branch if you want to use pre-release/testbranch:
   ```bash
   git checkout main
   pnpm install
   pnpm run dev
   ```
  Hint: Be aware that this can have beta-features and more likely got bugs than the stable release

>**Open the WebUI to test (Default: http://localhost:5173)**
>   - Beginngers: 
>     - Try to use a sophisticated Provider/Model like Anthropic with Claude Sonnet 3.x Models to get best results
>     - Explanation: The System Prompt currently implemented in bolt.diy cant cover the best performance for all providers and models out there. So it works better with some models, then other, even if the models itself are perfect for >programming
>     - Future: Planned is a Plugin/Extentions-Library so there can be different System Prompts for different Models, which will help to get better results

#### Staying Updated

To get the latest changes from the repository:

1. **Save Your Local Changes** (if any):

   ```bash
   git stash
   ```

2. **Pull Latest Updates**:

   ```bash
   git pull 
   ```

3. **Update Dependencies**:

   ```bash
   pnpm install
   ```

4. **Restore Your Local Changes** (if any):
   ```bash
   git stash pop
   ```

#### Troubleshooting Git Setup

If you encounter issues:

1. **Clean Installation**:

   ```bash
   # Remove node modules and lock files
   rm -rf node_modules pnpm-lock.yaml

   # Clear pnpm cache
   pnpm store prune

   # Reinstall dependencies
   pnpm install
   ```

2. **Reset Local Changes**:
   ```bash
   # Discard all local changes
   git reset --hard origin/main
   ```

Remember to always commit your local changes or stash them before pulling updates to avoid conflicts.

---

## Available Scripts

### Development
- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run test` - Run tests
- `pnpm run lint` - Run ESLint
- `pnpm run typecheck` - Run TypeScript compiler

### Docker
- `pnpm run dockerbuild` - Build Docker image (development)
- `pnpm run dockerbuild:prod` - Build Docker image (production)
- `pnpm run dockerrun` - Run Docker container
- `pnpm run dockerstart` - Start with Docker bindings

### Ollama Integration
- `pnpm run ollama:install` - Simple Ollama installation (recommended)
- `pnpm run ollama:setup` - Complete Ollama setup (native)
- `pnpm run ollama:docker` - Complete Ollama setup (Docker)
- `pnpm run ollama:start` - Start Ollama service
- `pnpm run ollama:status` - Check Ollama status
- `pnpm run ollama:test` - Test Ollama installation

### Deployment
- `pnpm run deploy` - Deploy to Cloudflare Pages
- `pnpm run preview` - Preview production build

---

## Contributing

We welcome contributions! Check out our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## Roadmap

Explore upcoming features and priorities on our [Roadmap](https://roadmap.sh/r/ottodev-roadmap-2ovzo).

---

## FAQ

For answers to common questions, issues, and to see a list of recommended models, visit our [FAQ Page](FAQ.md).


# Licensing
**Who needs a commercial WebContainer API license?**

bolt.diy source code is distributed as MIT, but it uses WebContainers API that [requires licensing](https://webcontainers.io/enterprise) for production usage in a commercial, for-profit setting. (Prototypes or POCs do not require a commercial license.) If you're using the API to meet the needs of your customers, prospective customers, and/or employees, you need a license to ensure compliance with our Terms of Service. Usage of the API in violation of these terms may result in your access being revoked.
