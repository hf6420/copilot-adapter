## 高级配置

精细调整提供商设置、启用视觉支持并控制诊断输出。

[打开扩展设置 →](command:copilot-adapter.openSettings)

---

### 各提供商配置

在 `copilot-adapter.providers` 下，每个提供商 ID（如 `deepseek`、`minimax`）支持以下设置：

| 键 | 说明 |
|----|------|
| `enabled` | 启用或禁用该提供商 |
| `baseUrl` | 覆盖 API 端点（适用于代理场景） |
| `temperature` | 采样温度（0–2） |
| `topP` | Top-p 核采样（0–1） |
| `tokenRatio` | 用于上下文追踪的字符/token 估算比例 |
| `streamUsage` | 代理不支持流式用量统计时设为 `false` |

---

### 视觉代理

视觉代理在将消息发送给纯文本模型之前，会把图片附件转换为文字描述。

选择一个支持视觉的模型（如 Copilot Chat 中可用的 GPT-4o 或 Claude 模型）：

[配置视觉代理 →](command:copilot-adapter.setVisionProxyModel)

---

### 调试模式

`copilot-adapter.debugMode`：

- **off** — 无输出
- **info** — 仅请求元数据（可安全分享）
- **verbose** — 完整请求体写入磁盘（请勿公开）
