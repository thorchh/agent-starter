## `src/lib/ai` (AI layer)

This folder contains the "AI boundary" for the template:

- Multi-provider support (OpenAI, Groq, AI Gateway)
- Model allowlisting + normalization
- System prompt(s)
- Tool registry
- Reasoning extraction (o-series models)

Keeping this separate from UI and route handlers makes upgrades easy:

- Swap providers (or route via AI Gateway) by changing one module
- Add tools without touching API routing logic
- Centralize prompt policies and safety rules

### Files

- `models.ts`: model dropdown options + server-side allowlist
- `provider.ts`: multi-provider routing and configuration
- `system-prompt.ts`: system prompt string (tool-aware, citation-aware)
- `tools/`: server tools registry

### Multi-Provider Support

The starter supports three provider types out of the box:

**OpenAI (Default)**
```typescript
// Handles: openai/gpt-5, openai/gpt-4o, openai/o4-mini, etc.
// Configured via: OPENAI_API_KEY
```

**Groq**
```typescript
// Handles: groq/deepseek-r1-distill-llama-70b
// Configured via: GROQ_API_KEY
```

**AI Gateway**
```typescript
// Handles: gateway/* models
// Configured via: AI_GATEWAY_API_KEY
```

Provider dispatch logic is in `provider.ts`:
- Checks model ID prefix (openai/, groq/, gateway/)
- Routes to appropriate provider
- Applies provider-specific configuration

### Adding a tool

1) Create a new file in `tools/`:
   - export a `tool({ description, parameters: zodSchema, execute })`
2) Export it from `tools/index.ts`
3) Restart dev server

See `tools/examples/` for templates showing:
- Database queries
- External API calls
- Custom search integration
- And more

### Adding a model

1) Add to `MODEL_OPTIONS` array in `models.ts`:
   ```typescript
   {
     label: "My Model",
     id: "provider/model-name",
   }
   ```

2) Add to `ALLOWED_MODEL_IDS` array:
   ```typescript
   "provider/model-name"
   ```

3) If using a new provider, update `provider.ts`:
   - Add provider dispatch logic
   - Configure provider-specific settings

### Model Allowlist Security

The server validates all model IDs against `ALLOWED_MODEL_IDS` before processing requests. This prevents:
- Unauthorized API calls to expensive models
- Typos causing errors
- Malicious model ID injection

If a model isn't allowlisted, the request is rejected with a clear error message.

### Reasoning Features (o-series models)

The template supports OpenAI's reasoning models (o4-mini, o1, etc.) with configurable behavior:

**Environment Variables:**
- `ENABLE_REASONING=true` - Enable reasoning summaries
- `OPENAI_REASONING_SUMMARY=auto|detailed` - Detail level
- `OPENAI_REASONING_EFFORT=minimal|low|medium|high` - Effort level

**How it works:**
1. `provider.ts` middleware extracts reasoning from response
2. Reasoning is added as `reasoning` message part
3. UI renders in collapsible "Thought process" section
4. Can be toggled with debug mode for verbose display

See the [OpenAI docs](https://ai-sdk.dev/providers/ai-sdk-providers/openai) for more details on reasoning configuration.

### Notes on model IDs

The UI sends prefixed model IDs like `openai/gpt-5`.

Individual providers expect un-prefixed IDs like `gpt-5`.

To keep the template stable (and easy to migrate), `models.ts` normalizes IDs:
- Strips provider prefix before passing to provider
- Validates against allowlist
- Provides clear error messages for invalid IDs

### Web Search

This starter uses OpenAI's built-in `web_search` tool (enabled via UI toggle). For custom search integration:
- See `tools/examples/searchCustomAPI.ts` for Tavily/SerpAPI/Exa templates
- Export custom search tool from `tools/index.ts`
- Remove or disable OpenAI's built-in search in API route




