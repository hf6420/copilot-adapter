# Custom Models via JSON

You can define custom models by writing a JSON configuration file. This is useful when you want to add models that are not included in the built-in provider lists, or when you want to override certain model parameters.

---

## Quick Start

1. Create a JSON file (e.g. `my-models.json`) with the following structure:

```jsonc
[
  {
    "id": "deepseek-v4-pro",              // Required · unique identifier, must be unique across all entries
    "label": "DeepSeek V4 Pro",           // Required · display name shown in the model selector
    "provider": "deepseek",               // Required · provider ID (deepseek | minimax | moonshot | qwen | zhipu)
    "endpoints": ["deepseek"],            // Required · array of endpoint IDs

    "family": "deepseek-v4",              // Optional · model family, default "custom"
    "version": "2025-04",                 // Optional · version string, default ""
    "maxInputTokens": 200000,             // Optional · max input tokens, default 128000
    "maxOutputTokens": 8192,              // Optional · max output tokens, default 32000
    "detail": "My custom model",          // Optional · description text, default ""
    "thinking": true,                     // Optional · supports thinking mode, default false
    "imageInput": false,                  // Optional · supports image input, default false
    "imageField": "image_url",            // Optional · image field name, only effective when imageInput=true
    "maxTools": 128,                      // Optional · max tool calls
    "contentTag": "think",                // Optional · thinking tag name in streamed responses

    // Omit thinkingConfig to inherit the provider's default
    "thinkingConfig": {                   // Optional
      "default": "high",                  // Required · default thinking mode value
      "options": [                        // Required · list of thinking mode options
        {
          "value": "high",               // Required · option value
          "label": "think.high",          // Optional · display label, defaults to value if omitted
          "hint": "think.high.hint",      // Optional · description hint
          "requestFields": {              // Optional · extra request fields
            "thinking": { "type": "enabled" }
          }
        },
        {
          "value": "none",               // Required
          "label": "think.none",          // Optional
          "hint": "think.none.hint",      // Optional
          "requestFields": {              // Optional
            "thinking": { "type": "disabled" }
          }
        }
      ]
    }
  }
]
```

2. Open VS Code Settings (`Ctrl/Cmd+,`) and set **Copilot Adapter › Custom Models Path** to the absolute path of your JSON file.

3. Reload the **Language Models** panel — your custom models will appear alongside built-in models.

---

## File Format

The JSON file must be a top-level **array** of model entry objects. Each entry defines one custom model.

---

## Field Reference

### `id` (required, `string`)

A unique identifier for your model. This is used internally to distinguish models and should be unique across all custom entries. Must be a non-empty string.

**Example:** `"my-custom-deepseek"`

---

### `label` (required, `string`)

The display name shown in the model selector. The extension appends `" (Custom)"` to distinguish custom models from built-in ones.

**Example:** `"My DeepSeek V4 Pro"`

---

### `provider` (required, `string`)

The ID of the built-in provider this model belongs to. Must match one of the supported provider IDs.

**Supported values:**

| Provider ID | Provider Name |
|-------------|---------------|
| `deepseek`  | DeepSeek      |
| `minimax`   | MiniMax       |
| `moonshot`  | Moonshot/Kimi |
| `qwen`      | Qwen          |
| `zhipu`     | Zhipu/GLM     |

**Example:** `"deepseek"`

---

### `endpoints` (required, `string[]`)

An array of endpoint IDs to apply this model to. Each value must be one of the endpoint IDs supported by the chosen provider.

**Supported endpoint IDs by provider:**

| Provider   | Endpoint IDs                            |
|------------|-----------------------------------------|
| `deepseek` | `deepseek`                              |
| `minimax`  | `minimaxi.com`, `minimax.io`            |
| `moonshot` | `moonshot.cn`, `moonshot.ai`            |
| `qwen`     | `cn`, `us`, `sgp`, `eu`                 |
| `zhipu`    | `bigmodel`, `bigmodel-coding`, `z.ai`, `z.ai-coding` |

**Example:** `["deepseek"]` or `["cn", "us"]`

---

### `family` (optional, `string`)

Model family classification. Defaults to `"custom"` if not specified.

**Example:** `"deepseek-v4"`

---

### `version` (optional, `string`)

Model version string. Defaults to `""`.

**Example:** `"2025-04"`

---

### `maxInputTokens` (optional, `number`)

Maximum number of input tokens the model supports. Must be a positive integer. Defaults to `128000` (128K).

**Example:** `200000`

---

### `maxOutputTokens` (optional, `number`)

Maximum number of output tokens the model can generate. Must be a positive integer. Defaults to `32000` (32K).

**Example:** `8192`

---

### `detail` (optional, `string`)

A description or detail text shown in the model information panel in VS Code. Defaults to empty.

**Example:** `"My custom fine-tuned DeepSeek model"`

---

### `thinking` (optional, `boolean`)

Whether this model supports reasoning/thinking mode. Defaults to `false`.

**Example:** `true`

---

### `thinkingConfig` (optional, `object`)

Configuration for the thinking/reasoning mode selector shown in the model configuration panel.

| Field     | Type                        | Description |
|-----------|-----------------------------|-------------|
| `default` | `string` (required)         | The default thinking mode value. Must match one of the option `value`s. |
| `options` | `array` of objects (required) | List of thinking mode options. |

Each option object:

| Field           | Type     | Description |
|-----------------|----------|-------------|
| `value`           | `string` (required) | The value sent to the API. |
| `label`           | `string` (optional) | Display label for this option (supports NLS keys). Defaults to `value` if omitted. |
| `hint`            | `string` (optional) | Description hint text (supports NLS keys like `"think.high.hint"`). |
| `requestFields`   | `object` (optional) | Additional fields merged into the API request body when this option is selected. |

**Example:**

```json
{
  "default": "high",
  "options": [
    {
      "value": "high",
      "label": "think.high",
      "hint": "think.high.hint",
      "requestFields": { "thinking": { "type": "enabled" } }
    },
    {
      "value": "none",
      "label": "think.none",
      "hint": "think.none.hint",
      "requestFields": { "thinking": { "type": "disabled" } }
    }
  ]
}
```

> **Note:** If you don't provide `thinkingConfig`, the model inherits the provider's built-in thinking configuration. If the provider has no thinking config either, no thinking mode selector is shown.

---

### `imageInput` (optional, `boolean`)

Whether this model supports image/image input (vision models). Defaults to `false`.

**Example:** `true`

---

### `imageField` (optional, `string`)

The field name used in the API request body for image data. Only meaningful when `imageInput` is `true`. Defaults to the provider's built-in image field (typically `"image_url"`).

**Example:** `"image"`

---

### `maxTools` (optional, `number`)

Maximum number of tool calls per request. Must be a positive integer. Defaults to the provider's built-in limit.

**Example:** `128`

---

### `contentTag` (optional, `string`)

Tag name used to identify thinking/reasoning content embedded in the streaming response. Only needed for providers that don't use a separate thinking field. For MiniMax models, the tag is typically `"think"`.

**Example:** `"think"`

---

## Advanced Configuration

### Setting the custom models path

You can configure the path via:

- **Settings UI:** Search for `copilot-adapter.customModelsPath` in VS Code Settings
- **settings.json:** Add `"copilot-adapter.customModelsPath": "/path/to/my-models.json"`

### Validation

The extension validates your JSON file on load. If there are errors (invalid fields, unknown provider IDs, missing required fields), they appear as diagnostic squiggles in the JSON file. Fix the errors and the models will load automatically on the next validation cycle.

### Multiple models in one file

You can define as many models as you need in a single JSON file. Each model can target different providers and endpoints:

```json
[
  {
    "id": "my-deepseek",
    "label": "My DeepSeek",
    "provider": "deepseek",
    "endpoints": ["deepseek"],
    "thinking": true
  },
  {
    "id": "my-qwen",
    "label": "My Qwen",
    "provider": "qwen",
    "endpoints": ["cn", "us"],
    "imageInput": true
  }
]
```
