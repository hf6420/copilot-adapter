## 添加模型提供商

有两种方式可以连接提供商。**方式一是原生 VS Code 方式** —— 密钥由 VS Code 统一管理，后续无需额外操作。

---

### 方式一 — 语言模型面板（原生方式，推荐）

1. 打开语言模型面板：
   [打开语言模型管理](command:workbench.action.chat.manage)

2. 在 **Language Model Providers** 下找到 **DeepSeek**、**MiniMax**、**Moonshot**、**Qwen**、**Zhipu**。

3. 点击 **Configure** 按钮，按提示输入你的 API Key。

在此获取 API Key：

- **DeepSeek** - [platform.deepseek.com](https://platform.deepseek.com)
- **MiniMax** - [minimaxi.com](https://www.minimaxi.com/) | [minimax.io](https://www.minimax.io/) 
- **Moonshot (Kimi)** - [platform.moonshot.cn](https://platform.moonshot.cn/) | [platform.moonshot.ai](https://platform.moonshot.ai/) 
- **Qwen** - [bailian.console.aliyun.com](https://bailian.console.aliyun.com/)
- **Zhipu (GLM)** - [open.bigmodel.cn](https://open.bigmodel.cn/) | [api.z.ai](https://api.z.ai/) 

> 密钥由 VS Code 安全存储，并自动传递给扩展，无需手动管理。详见[安全性](https://github.com/eowl/copilot-adapter#security)。

---

### 方式二 — 添加 API Key 命令

运行下方命令，选择提供商后输入密钥。密钥将存储在扩展自身的 Secret Storage 中。

[添加 API Key](command:copilot-adapter.addApiKey)
