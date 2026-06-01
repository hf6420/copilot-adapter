## Advanced configuration

Fine-tune providers, enable vision support, and control diagnostic output.

[Open Extension Settings →](command:copilot-adapter.openSettings)

---

### Per-provider settings

Under `copilot-adapter.providers`, each provider ID (e.g. `deepseek`, `minimax`) supports:

| Key | Description |
|-----|-------------|
| `enabled` | Enable or disable the provider |
| `baseUrl` | Override the API endpoint (useful for proxies) |
| `temperature` | Sampling temperature (0–2) |
| `topP` | Top-p nucleus sampling (0–1) |
| `tokenRatio` | Characters-per-token estimate for context tracking |
| `streamUsage` | Set `false` if your proxy doesn't support stream usage stats |

---

### Vision proxy

The vision proxy converts image attachments to text descriptions before sending them to text-only models.

Set a vision-capable model (e.g. a GPT-4o or Claude model available in Copilot Chat):

[Configure Vision Proxy →](command:copilot-adapter.setVisionProxyModel)

---

### Debug mode

`copilot-adapter.debugMode`:

- **off** — no output
- **info** — request metadata only (safe to share)
- **verbose** — full payloads written to disk (keep local)
