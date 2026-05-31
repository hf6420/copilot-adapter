# AI Models Adaptor for Copilot Chat

> 将 DeepSeek、MiniMax 等第三方 AI 模型无缝接入 VS Code Copilot Chat 模型选择器。

**Bring Your Own Key (BYOK)** — 自备 API Key，在 Copilot Chat 中直接使用兼容的 AI 模型，支持视觉理解、思考模式、Agent 工具调用等完整能力。

## 目录

- [功能特性](#功能特性)
- [架构概览](#架构概览)
- [目录结构](#目录结构)
- [支持的 AI 提供商](#支持的-ai-提供商)
- [配置项](#配置项)
- [命令列表](#命令列表)
- [核心工作流程](#核心工作流程)
- [开发与构建](#开发与构建)
- [FAQ](#faq)

---

## 功能特性

- **多模型支持** — 在 Copilot Chat 模型选择器中直接使用 DeepSeek、MiniMax 等模型
- **Bring Your Own Key** — 自行提供 API Key，通过 VS Code SecretStorage 安全存储
- **视觉代理 (Vision Proxy)** — 为不支持图片输入的模型自动调用视觉模型描述图片内容
- **思考/推理模式** — 支持 DeepSeek 的 `reasoning_content` 和 MiniMax 的 `thinking_content` 流式输出
- **Agent 工具调用** — 完整支持 VS Code 的 LanguageModelToolCall API
- **对话连续性** — 通过 Replay Marker 追踪跨轮次的对话分段，保持上下文连贯
- **自适应 Token 计数** — 基于实际 API 用量通过指数移动平均校准 chars-per-token 比率
- **实验性功能：工具列表稳定化** — 预激活可用工具以提升上下文缓存命中率
- **工具漂移检测** — 检测并警告工具列表不稳定导致的缓存命中率下降
- **分级调试** — 支持 Minimal/Metadata/Verbose 三级调试输出
- **深链接支持** — `copilot-adaptor://` URI 协议支持快速配置 API Key 和查看日志
- **首次运行引导** — 自动打开入门向导，引导用户完成初始配置

---

## 架构概览

扩展实现了 VS Code 的 [`LanguageModelChatProvider`](https://code.visualstudio.com/api/extension-guides/language-model) 接口，将第三方 AI 模型桥接到 Copilot Chat 中。核心架构分为以下层次：

```
┌──────────────────────────────────────────────────────────┐
│                    VS Code Copilot Chat                   │
│    (通过 LanguageModelChatProvider 接口集成)               │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│  activate/main.ts  (扩展入口)                             │
│  ├─ cmds.ts        注册 6 个命令                          │
│  ├─ links.ts       copilot-adaptor:// URI 处理           │
│  ├─ mount.ts       注册 LM Provider 到 VS Code           │
│  ├─ onboard.ts     首次运行向导                           │
│  └─ diag.ts        启动诊断日志                           │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│  bridge/hub.ts  (Adapter — 核心提供者)                    │
│  ├─ provideLanguageModelChatInformation  — 列出可用模型    │
│  ├─ provideLanguageModelChatResponse    — 处理聊天请求    │
│  └─ provideTokenCount                   — Token 估算      │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│  bridge/prepare.ts  (请求装配管道)                        │
│  ├─ 图片解析 → extras/image/describe.ts                   │
│  ├─ 工具路由 → bridge/tools/gate.ts                       │
│  └─ 消息/工具翻译 → bridge/translate.ts                    │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│  llm/http.ts  (SSE 流式 HTTP 客户端)                      │
│  ├─ 解析 content / thinking / tool-call / usage 事件      │
│  └─ 错误处理 → llm/fault.ts                               │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│  bridge/emit.ts  (响应发射到 VS Code)                     │
│  ├─ LanguageModelTextPart      — 文本内容                 │
│  ├─ LanguageModelThinkingPart  — 推理/思考内容            │
│  ├─ LanguageModelToolCallPart  — 工具调用                 │
│  └─ LanguageModelDataPart      — Replay Marker            │
└──────────────────────────────────────────────────────────┘
```

### 关键组件说明

| 组件 | 文件 | 职责 |
|------|------|------|
| **Adapter** | `bridge/hub.ts` | 核心类，实现 `vscode.LanguageModelChatProvider` 的三个接口方法，管理 API Key 和视觉代理 |
| **会话管理** | `bridge/session.ts` | 从 Replay Marker 中提取或生成 UUID，追踪对话连续性 |
| **消息翻译** | `bridge/translate.ts` | 将 VS Code 消息格式转换为 OpenAI 兼容的 API 格式，处理 thinking 注入 |
| **请求准备** | `bridge/prepare.ts` | 装配完整的 API 请求体，处理图片、工具、最大 Token 等 |
| **流式响应** | `bridge/emit.ts` | 消费 HTTP SSE 流并发射到 VS Code progress sink |
| **Token 统计** | `bridge/tally.ts` | 基于字符数和 chars-per-token 比率的 Token 估算 |
| **工具路由** | `bridge/tools/gate.ts` | 决定工具流方向：正常处理 / 预热 / 拒绝 |
| **预热机制** | `bridge/tools/warmup.ts` | 实验性功能，预激活工具以优化缓存 |
| **错误处理** | `llm/fault.ts` | 提供结构化的 API 错误，包含用户友好的摘要和诊断信息 |

---

## 目录结构

```
copilot-adaptor/
├── src/                           # 主源码（当前版本）
│   ├── extension.ts               # 入口：导出 activate/deactivate
│   ├── settings.ts                # 设置访问器
│   ├── secrets.ts                 # API Key 管理 (SecretStorage)
│   ├── enc.ts                     # JSON 序列化（处理孤立代理项）
│   ├── log.ts                     # 输出通道
│   ├── nls.ts                     # 本地化（中/英）
│   │
│   ├── activate/                  # 激活生命周期
│   │   ├── main.ts                # activate/deactivate 入口
│   │   ├── cmds.ts                # 注册 6 个命令
│   │   ├── diag.ts                # 启动诊断
│   │   ├── links.ts               # URI 深链接处理
│   │   ├── mount.ts               # 注册 LanguageModelChatProvider
│   │   └── onboard.ts             # 首次运行向导
│   │
│   ├── bridge/                    # 核心桥接逻辑
│   │   ├── hub.ts                 # Adapter 主类
│   │   ├── emit.ts                # 流式响应发射
│   │   ├── prepare.ts             # 请求装配
│   │   ├── session.ts             # 会话管理
│   │   ├── translate.ts           # 消息/工具格式转换
│   │   ├── tally.ts               # Token 计数
│   │   ├── info.ts                # 模型信息构建
│   │   └── tools/                 # 工具处理
│   │       ├── gate.ts            # 工具流路由
│   │       ├── prep.ts            # 工具列表构建
│   │       ├── warmup.ts          # 预热机制
│   │       ├── alert.ts           # 工具漂移警告
│   │       └── defs.ts            # 常量定义
│   │
│   ├── providers/                 # AI 提供商定义
│   │   ├── spec.ts                # Provider/Model 类型定义
│   │   ├── all.ts                 # 提供商注册表
│   │   ├── deepseek.ts            # DeepSeek 提供商
│   │   └── minimax.ts             # MiniMax 提供商
│   │
│   ├── llm/                       # LLM 通信层
│   │   ├── types.ts               # API 数据类型（OpenAI 兼容）
│   │   ├── http.ts                # SSE 流式 HTTP 客户端
│   │   └── fault.ts               # 错误处理
│   │
│   ├── extras/                    # 额外功能
│   │   ├── image/                 # 视觉代理
│   │   │   ├── defaults.ts        # 默认配置
│   │   │   ├── describe.ts        # 图片描述核心逻辑
│   │   │   ├── picker.ts          # 视觉模型选择器
│   │   │   └── types.ts           # 类型和统计
│   │   └── replay/                # 回放标记
│   │       ├── defs.ts            # 常量
│   │       ├── marker.ts          # 标记的构建/解析
│   │       └── types.ts           # 类型定义
│   │
│   └── trace/                     # 调试与诊断
│       ├── classify.ts            # 请求分类
│       └── write.ts               # 请求 Dump 写入
│
├── src.bak/                       # 旧版本源码（保留作参考）
│   ├── core/                      # OpenAI 兼容客户端 + 错误处理
│   ├── pipeline/                  # 请求流水线（转换、流处理等）
│   ├── providers/                 # 提供商标记 + 注册表
│   ├── capabilities/              # 推理标记 + 视觉解析
│   ├── runtime/                   # 生命周期、命令、诊断
│   ├── debug/                     # 缓存追踪、分类器、Dump
│   ├── auth.ts                    # API Key 管理
│   ├── config.ts                  # 配置读取
│   └── ...                        # 其他工具模块
│
├── package.json                   # 扩展清单
├── tsconfig.json                  # TypeScript 配置
├── eslint.config.mjs              # ESLint 配置
└── vscode.proposed.languageModelThinkingPart.d.ts  # Thinking API 声明
```

---

## 支持的 AI 提供商

### DeepSeek (默认启用)

| 模型 ID | 显示名称 | API 模型 ID | 最大输入 Token | 最大输出 Token | 能力 |
|---------|---------|-------------|---------------|---------------|------|
| `deepseek-v4-flash` | DeepSeek V4 Flash | `deepseek-chat` | 655,360 | 393,216 | 工具 (128)、推理 |
| `deepseek-v4-pro` | DeepSeek V4 Pro | `deepseek-reasoner` | 655,360 | 393,216 | 工具 (128)、推理 |

- **默认端点**: `https://api.deepseek.com`
- **思考字段**: `reasoning_content`
- **推理模式配置**: `off` / `on` / `max`

### MiniMax

| 模型 ID | 显示名称 | API 模型 ID | 最大输入 Token | 最大输出 Token | 能力 |
|---------|---------|-------------|---------------|---------------|------|
| `minimax-text-01` | MiniMax Text-01 | `MiniMax-Text-01` | 1,000,000 | 8,192 | 工具 (32)、图片、推理 |
| `minimax-m1` | MiniMax M1 | `MiniMax-M1` | 1,000,000 | 40,960 | 工具 (32)、推理 |

- **默认端点**: `https://api.minimax.io/v1`
- **思考字段**: `thinking_content`
- **思考预算配置**: `off` / `standard` / `deep`

---

## 配置项

| 配置键 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `copilot-adaptor.providers` | `object` | `{"deepseek": {"enabled": true}}` | 各 Provider 的启用状态和 API 端点覆盖 |
| `copilot-adaptor.maxTokens` | `number` | `0` | 最大输出 Token 数，`0` 表示不限制 |
| `copilot-adaptor.visionModel` | `string` | `""` | 视觉代理模型 ID，留空自动检测 |
| `copilot-adaptor.visionPrompt` | `string` | *(内置默认提示)* | 发送给视觉代理的描述提示词 |
| `copilot-adaptor.debugMode` | `enum` | `"minimal"` | 调试级别：`minimal` / `metadata` / `verbose` |
| `copilot-adaptor.experimental.stabilizeToolList` | `boolean` | `false` | 实验性：稳定工具列表以提升缓存命中率 |

### `copilot-adaptor.providers` 格式示例

```json
{
  "deepseek": {
    "enabled": true,
    "baseUrl": "https://api.deepseek.com"
  },
  "minimax": {
    "enabled": true,
    "baseUrl": "https://api.minimax.io/v1"
  }
}
```

### 调试模式说明

| 级别 | 日志 | 请求 Dump | Token 上报 | 适用场景 |
|------|------|-----------|-----------|---------|
| **Minimal** | ❌ | ❌ | ✅ | 日常使用 |
| **Metadata** | ✅ (隐私安全) | ❌ | ✅ | 公开 Issue 反馈 |
| **Verbose** | ✅ | ✅ (含敏感内容) | ✅ | 本地调试 |

---

## 命令列表

| 命令 ID | 标题 | 功能 |
|---------|------|------|
| `copilot-adaptor.setApiKey` | AI Models: Set API Key | 设置 API Key（可选指定 Provider） |
| `copilot-adaptor.clearApiKey` | AI Models: Clear API Key | 清除 API Key（可选指定 Provider） |
| `copilot-adaptor.setVisionModel` | AI Models: Set Vision Proxy Model | 从列表选择视觉代理模型 |
| `copilot-adaptor.openSettings` | AI Models: Open Settings | 打开扩展设置页面 |
| `copilot-adaptor.showLogs` | AI Models: Show Logs | 显示诊断日志输出通道 |
| `copilot-adaptor.openRequestDumpsFolder` | AI Models: Open Request Dumps Folder | 打开请求 Dump 文件夹 |

### 深链接 URI

扩展支持通过 `copilot-adaptor://` URI 协议执行操作：

- `copilot-adaptor://configure-api-key?deepseek` — 配置指定 Provider 的 API Key
- `copilot-adaptor://show-logs` — 打开日志输出通道

---

## 核心工作流程

### 聊天请求处理流程

1. **用户发送消息** → VS Code Copilot Chat 调用 `provideLanguageModelChatResponse`
2. **会话识别** → `Session.fromMessages()` 从 Replay Marker 解析或创建新会话 UUID
3. **图片解析** → 若模型不支持图片，调用视觉代理模型描述图片内容
4. **工具路由** → `routeToolFlow()` 决定工具流方向
5. **消息/工具翻译** → 将 VS Code 消息格式转换为 OpenAI 兼容的 API 格式
6. **请求发送** → `streamHttp()` 通过 SSE 流式发送 HTTP 请求
7. **响应流式处理** → 解析 content/thinking/tool-call/usage 事件
8. **响应发射** → 通过 `progress.report()` 将各部分发射到 VS Code
9. **Replay Marker 附加** → 在流末尾附加包含元数据的 DataPart

### API Key 优先级

1. VS Code SecretStorage（最安全，推荐）
2. 设置 `copilot-adaptor.providers` 中的 `apiKey` 字段（向后兼容）

---

## 开发与构建

### 环境要求

- VS Code >= 1.116.0
- Node.js >= 24
- TypeScript 6.0+

### 命令

```bash
# 编译
npm run compile        # 清理并编译 TypeScript

# 开发（监视模式）
npm run watch          # 启动 TypeScript 监视编译

# 代码检查
npm run lint           # ESLint 检查
npm run format         # Prettier 格式化
npm run format:check   # 格式化检查

# 打包
npm run package        # 使用 vsce 打包为 .vsix
```

### 项目配置

- **TypeScript**: 目标 `ES2022`，模块系统 `commonjs`，输出到 `out/` 目录
- **Lint**: ESLint + `typescript-eslint` + `prettier`
- **打包**: `@vscode/vsce`
- **API**: 使用 VS Code 1.116.0 稳定 API + `languageModelThinkingPart` 提案 API

### 调试启动

项目预配置了两个调试启动任务：

- **Launch Extension Host (Insiders CLI)** — 使用 VS Code Insiders 启动扩展开发主机
- **Launch Extension Host (Stable CLI)** — 使用 VS Code Stable 启动扩展开发主机

---

## 回放标记 (Replay Marker)

扩展在每次聊天响应的末尾注入一个 `stateful_marker` 类型的 `LanguageModelDataPart`，用于跨轮次传递元数据：

- **`segmentId`**: 用于缓存键追踪的 UUID
- **`vision.text`**: 上一轮次中由视觉代理生成的图片描述文本
- **`reasoning.text`**: 上一轮次中模型的推理/思考内容

这些标记确保：
- 对话分段可被唯一标识以支持缓存优化
- 视觉描述不需要在每次对话轮次中重新生成
- 推理内容可以被正确注入到后续请求的 thinking 字段中

标记格式兼容旧版 `deepseek-v4-for-copilot` 扩展的历史数据。

---

## 旧版源码 (src.bak)

`src.bak/` 目录包含项目的原始架构，作为参考保留。与当前 `src/` 的主要区别：

| 方面 | `src/` (当前) | `src.bak/` (旧版) |
|------|--------------|-------------------|
| 架构 | 扁平化、职责明确 | 分层较多 |
| HTTP 客户端 | 异步生成器 `streamHttp()` | 回调模式 `streamChatCompletion()` |
| Provider 定义 | `Provider`/`Model` 接口 + `requestExtras`/`configSchema` | `ProviderDefinition` + `buildRequestParams`/`buildConfigSchema` |
| 工具处理 | `gate.ts` + `warmup.ts` + `alert.ts` | `tools/flow.ts` |
| 会话管理 | `Session` 类 + 简单 UUID 生成 | `resolveConversationSegment` + 更复杂的逻辑 |
| API Key 管理 | `KeyStore` 类 | `ProviderAuthManager` 类 |

---

## 许可证

MIT
# copilot-adaptor
