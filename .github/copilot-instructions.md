# Copilot Instructions for copilot-adapter

This is a VS Code extension that adds third-party AI model providers (DeepSeek, MiniMax, Moonshot/Kimi, Qwen, Zhipu/GLM) to VS Code's native Copilot Chat via the `languageModelChatProviders` contribution point.

## Project Conventions

- **Language:** TypeScript (strict mode, ES2022 target, CommonJS modules)
- **Lint:** `typescript-eslint` + Prettier; `@typescript-eslint/no-explicit-any` is warn, `@typescript-eslint/no-unused-vars` errors (args prefixed `_` ignored)
- **Formatting:** Prettier handles all formatting — don't manually adjust style
- **Build:** `npm run compile` compiles `src/` into `dist/`
- **Tests:** Mocha-based, run via the VS Code test runner; test files mirror source structure under `test/tests/`
- **NLS:** Localization uses `package.nls.json` + `src/nls/`; all user-facing strings must be localized
- **Secrets:** API keys stored exclusively in VS Code `SecretStorage` — never in settings.json, never in plaintext files
- **No runtime dependencies:** All networking uses VS Code's built-in HTTP facilities; no third-party libraries at runtime

## Architecture

```
src/extension.ts → src/activate/ → mount.ts (registers providers)
                                  → commands.ts, diag.ts, links.ts, onboard.ts
src/bridge/       — adapter, session management, streaming, token tally, request translation
src/providers/    — one folder per vendor, each with endpoints.ts, models.ts, provider.ts
src/marker/       — codec for stream markers (thinking/reasoning parts)
src/vision/       — image resolution and vision model proxy
src/client/       — HTTP client + error handling
src/nls/          — localization strings
src/trace/        — debugging/dump utilities
```

## Behavioral Guidelines

### 0. Language

- Always respond in Chinese (简体中文).

### 1. Think Before Coding

- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

- Minimum code that solves the problem. Nothing speculative.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

- Touch only what you must. Clean up only your own mess.
- Don't "improve" adjacent code, comments, or formatting (Prettier owns formatting).
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.
- Remove only imports/variables/functions that YOUR changes made unused.
- Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan with verification steps.

### 5. Project-Specific Rules

- **Always localize** user-facing strings: add entries to `package.nls.json` (English) and `package.nls.zh-cn.json` (Chinese), and reference keys in `src/nls/`.
- **Never touch secrets:** API keys go through `vscode.SecretStorage`, never settings.json or any file.
- **Test alongside code:** When adding a new feature, add corresponding tests in `test/tests/` following the existing mirror structure.
- **No runtime dependencies:** Don't add npm packages that would be needed at runtime. Dev dependencies (types, test tooling) are fine.
- **VS Code API only:** Use `vscode.workspace.getConfiguration`, `vscode.SecretStorage`, `vscode.lm.registerLanguageModelChatProvider`, etc. — no external HTTP libraries.
