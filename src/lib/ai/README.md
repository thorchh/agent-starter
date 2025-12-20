## `src/lib/ai` (AI layer)

This folder contains the “AI boundary” for the template:

- Provider wiring (OpenAI by default)
- Model allowlisting + normalization
- System prompt(s)
- Tool registry

Keeping this separate from UI and route handlers makes upgrades easy:

- Swap providers (or route via AI Gateway) by changing one module
- Add tools without touching API routing logic
- Centralize prompt policies and safety rules

### Files

- `models.ts`: model dropdown options + server-side allowlist
- `provider.ts`: provider configuration
- `system-prompt.ts`: system prompt string
- `tools/`: server tools

### Adding a tool

1) Create a new file in `tools/`:
   - export a `tool({ description, parameters: zodSchema, execute })`
2) Export it from `tools/index.ts`
3) Restart dev server

### Notes on model IDs

The UI sends model IDs like `openai/gpt-5`.

The OpenAI provider expects IDs like `gpt-5`.

To keep the template stable (and easy to migrate), `models.ts` normalizes and
the server validates against an allowlist.


