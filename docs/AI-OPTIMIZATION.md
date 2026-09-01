# AI 链路与微信小程序优化方案

## 已完成的代码改造

### OpenAI 兼容接入

项目现在使用 `src/lib/ai/openai-compatible.ts` 调用 Chat Completions，不再依赖写死的 Coze SDK、模型或环境。只需要在服务端配置：

```bash
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

`OPENAI_BASE_URL` 可以是供应商根地址，也可以直接填写完整的 `/chat/completions` 地址。兼容 OpenAI 协议的网关、私有部署模型和第三方模型均可复用同一套代码。

可选参数：

- `OPENAI_TIMEOUT_MS`：单次请求超时，默认 45000ms。
- `OPENAI_MAX_RETRIES`：网络错误、408、409、425、429 和 5xx 的最大重试次数，默认 2。
- `OPENAI_JSON_MODE`：默认 `true`，网关不支持 `response_format=json_object` 时会自动重试为普通文本并继续解析。
- `OPENAI_ORG_ID`、`OPENAI_PROJECT_ID`：需要时附加 OpenAI 请求头。

不要使用 `NEXT_PUBLIC_OPENAI_API_KEY`。任何 `NEXT_PUBLIC_` 变量都会进入浏览器包，微信小程序也不能直接持有模型密钥。

### API 行为

- `POST /api/ai/styling`：保留现有 SSE 进度事件，最后发送 `result` 或带 `code` 的 `error`。
- `POST /api/ai/complete`：只补充主体缺失槽位和鞋履，包、配饰改为可选，不再强行补齐。
- `POST /api/ai/analyze-reference`：只接受 HTTPS 图片地址或不超过 8MB 的 `data:image/*`，降低 SSRF 和超大请求风险。
- `POST /api/ai/recreate`：沿用参考图复现链路并返回结构差异。
- `GET /api/ai/status`：只返回供应商地址、模型和超时配置，不返回密钥，便于部署后诊断。

所有 AI 返回仍会经过服务端候选 ID、可用状态、重复、硬约束和主体完整性校验。校验失败的方案会被丢弃，避免把模型幻觉直接呈现给用户。

## 推荐的目标架构

```text
微信小程序
  -> HTTPS API/BFF（鉴权、限流、请求校验）
  -> 衣橱召回（可用状态、天气、场合、用户约束）
  -> OpenAI-compatible Chat Completions
  -> JSON 解析 + 确定性校验 + 一次修复
  -> 结果缓存/穿着记录/用户反馈
```

### 1. 输入层

- 将自由文本拆为 `occasion`、`weather`、`must_use`、`avoid`、`locked` 和 `style`，保留原始文本用于解释。
- 小程序只提交衣物 ID 和结构化偏好，不提交完整衣物对象，避免客户端篡改库存属性。
- 图片先上传对象存储，API 只接收短期签名 HTTPS URL；生产环境不要长期保存原始人像图。

### 2. 召回层

- 先按 `status=available`、用户归属和硬约束过滤，再按槽位召回。
- 再应用天气和场合软过滤；召回为空时返回明确缺口，不让模型“创造一件衣服”。
- 候选数量建议每槽位 8-15 件，随衣橱规模增加时引入颜色/材质向量检索，但仍以结构化过滤为前置条件。

### 3. 模型层

- 系统 Prompt 固定规则，用户文本和衣物字段明确标记为不可信数据。
- 生产推荐使用 JSON 输出；不支持 JSON mode 的兼容网关自动降级。
- 推荐最多 3 套：稳妥、舒适、探索。模型不输出百分比等伪精确分数。
- 将温度、场合、偏好和召回候选放在 user message，便于后续缓存系统 Prompt。

### 4. 校验与降级

- 服务端只接受候选库中的 ID，并再次检查可用状态、重复、锁定/必选/避免约束和主体完整性。
- 模型超时、限流、返回空内容或非法 JSON 时，返回稳定错误码；推荐链路可以切换到规则 fallback。
- 前端根据 `AI_NOT_CONFIGURED`、`AI_RATE_LIMITED`、`AI_TIMEOUT` 和 `AI_NETWORK_ERROR` 显示不同重试提示。

### 5. 微信小程序落地

- 在微信公众平台配置一个 HTTPS 合法域名，例如 `https://wardrobe.example.com`。
- 小程序通过 `wx.request` 调用 `/api/ai/styling`；SSE 在基础库和网关不稳定时可改为普通 JSON 长轮询，服务端逻辑无需改变。
- API 层增加微信登录态校验、用户 ID 绑定、每用户每分钟限流和每日 token 预算。
- 图片使用 `wx.chooseMedia` 后上传对象存储，再把签名 URL 交给参考图分析接口。
- `item_id`、偏好和穿着记录持久化到数据库；当前 localStorage 仅适合原型阶段。

## 上线前检查清单

1. 在部署平台设置 `.env.example` 中的服务端变量，并访问 `/api/ai/status` 确认配置。
2. 使用一个真实可用的 OpenAI-compatible endpoint 测试推荐、补全、参考图分析和复现四条链路。
3. 为 AI 请求记录 request id、耗时、状态码、模型和 token 用量；日志中禁止记录 API key、完整图片 URL 和用户隐私文本。
4. 配置超时、429 重试上限和熔断，避免供应商异常时拖垮小程序体验。
5. 为“无候选”“硬约束冲突”“模型空响应”“非法 ID”“超时”补充端到端测试。
6. 将 Prompt 和模型配置版本化，记录每次推荐使用的版本，便于回放和评估。

## 迭代优先级

**P0（上线必做）**：服务端密钥、微信登录态、数据库替代 localStorage、限流、错误监控、图片签名 URL。

**P1（体验提升）**：推荐结果缓存、按用户反馈调整排序、天气预报缓存、流式文案展示、收藏/穿着后反馈按钮。

**P2（智能化）**：衣物图片自动标注、向量检索、个人风格画像、跨天衣物新鲜度优化、离线规则推荐。

官方接口契约可参考 OpenAI [Chat Completions API Reference](https://platform.openai.com/docs/api-reference/chat/create)。
