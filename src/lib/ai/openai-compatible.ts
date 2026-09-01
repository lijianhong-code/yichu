/**
 * OpenAI-compatible Chat Completions client.
 *
 * The API key is read on the server only. Providers that implement the
 * OpenAI-compatible contract can be used by changing the environment values.
 */

export type TextContentPart = { type: 'text'; text: string };
export type ImageContentPart = {
  type: 'image_url';
  image_url: { url: string; detail?: 'auto' | 'low' | 'high' };
};
export type MessageContent = string | Array<TextContentPart | ImageContentPart>;

export type Message = {
  role: 'system' | 'developer' | 'user' | 'assistant' | 'tool';
  content: MessageContent;
  name?: string;
  tool_call_id?: string;
};

export interface AIClientConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  organization?: string;
  project?: string;
  timeoutMs: number;
  maxRetries: number;
  jsonMode: boolean;
}

export interface InvokeOptions {
  model?: string;
  temperature?: number;
  retries?: number;
  timeoutMs?: number;
  jsonMode?: boolean;
}

export interface ChatCompletionResult {
  content: string;
  id?: string;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  raw: unknown;
}

export class AIConfigurationError extends Error {
  readonly code = 'AI_NOT_CONFIGURED';

  constructor(message = 'AI 服务尚未配置，请设置 OPENAI_API_KEY') {
    super(message);
    this.name = 'AIConfigurationError';
  }
}

export class AIProviderError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly retryable: boolean;

  constructor(message: string, options: { code?: string; status?: number; retryable?: boolean } = {}) {
    super(message);
    this.name = 'AIProviderError';
    this.code = options.code || 'AI_PROVIDER_ERROR';
    this.status = options.status;
    this.retryable = options.retryable ?? false;
  }
}

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value?.trim() || undefined;
}

function readPositiveInt(name: string, fallback: number): number {
  const value = Number.parseInt(readEnv(name) || '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** Normalize either a provider root URL or a full completions URL. */
export function normalizeChatCompletionsUrl(baseUrl: string): string {
  const normalized = baseUrl.trim().replace(/\/+$/, '');
  if (!normalized) return 'https://api.openai.com/v1/chat/completions';
  if (/\/chat\/completions$/i.test(normalized)) return normalized;
  return `${normalized}/chat/completions`;
}

export function getAIConfig(): AIClientConfig {
  const apiKey = readEnv('OPENAI_API_KEY') || readEnv('AI_API_KEY');
  if (!apiKey) throw new AIConfigurationError();

  const baseUrl = readEnv('OPENAI_BASE_URL')
    || readEnv('OPENAI_API_URL')
    || readEnv('AI_BASE_URL')
    || readEnv('AI_API_URL')
    || 'https://api.openai.com/v1';
  const model = readEnv('OPENAI_MODEL') || readEnv('AI_MODEL') || 'gpt-4o-mini';

  return {
    apiKey,
    baseUrl: normalizeChatCompletionsUrl(baseUrl),
    model,
    organization: readEnv('OPENAI_ORG_ID'),
    project: readEnv('OPENAI_PROJECT_ID'),
    timeoutMs: readPositiveInt('OPENAI_TIMEOUT_MS', 45_000),
    maxRetries: readPositiveInt('OPENAI_MAX_RETRIES', 2),
    jsonMode: (readEnv('OPENAI_JSON_MODE') || 'true').toLowerCase() !== 'false',
  };
}

/** Return a safe provider URL for diagnostics without credentials or query tokens. */
export function getSafeProviderUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.username = '';
    parsed.password = '';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return '[invalid base url]';
  }
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object') {
    const value = payload as { error?: unknown; message?: unknown };
    if (value.error && typeof value.error === 'object' && 'message' in value.error) {
      const message = (value.error as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message.trim();
    }
    if (typeof value.error === 'string' && value.error.trim()) return value.error.trim();
    if (typeof value.message === 'string' && value.message.trim()) return value.message.trim();
  }
  return `AI 服务请求失败（HTTP ${status}）`;
}

function redactSecret(message: string, secret: string): string {
  return secret ? message.split(secret).join('[REDACTED]') : message;
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function contentToText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((part) => {
      if (typeof part === 'string') return part;
      if (part && typeof part === 'object' && 'text' in part) {
        const text = (part as { text?: unknown }).text;
        return typeof text === 'string' ? text : '';
      }
      return '';
    })
    .join('');
}

function backoff(attempt: number): Promise<void> {
  const delay = Math.min(4_000, 400 * 2 ** attempt) + Math.round(Math.random() * 150);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

async function requestCompletion(
  config: AIClientConfig,
  messages: Message[],
  options: Required<Pick<InvokeOptions, 'temperature' | 'jsonMode'>> & { model: string; timeoutMs: number },
  includeJsonMode: boolean,
): Promise<{ response: Response; payload: unknown }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const body: Record<string, unknown> = {
      model: options.model,
      messages,
      temperature: options.temperature,
      stream: false,
    };
    if (includeJsonMode) body.response_format = { type: 'json_object' };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    };
    if (config.organization) headers['OpenAI-Organization'] = config.organization;
    if (config.project) headers['OpenAI-Project'] = config.project;

    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    return { response, payload };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AIProviderError(`AI 请求超时（${options.timeoutMs}ms）`, {
        code: 'AI_TIMEOUT',
        retryable: true,
      });
    }
    throw new AIProviderError('无法连接 AI 服务，请检查 baseUrl 和网络连接', {
      code: 'AI_NETWORK_ERROR',
      retryable: true,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function invokeOpenAI(
  messages: Message[],
  options: InvokeOptions = {},
): Promise<ChatCompletionResult> {
  const config = getAIConfig();
  const model = options.model?.trim() || config.model;
  const temperature = Math.min(2, Math.max(0, options.temperature ?? 0.3));
  const timeoutMs = Math.max(1_000, options.timeoutMs ?? config.timeoutMs);
  const maxRetries = Math.max(0, options.retries ?? config.maxRetries);
  const requestedJsonMode = options.jsonMode ?? config.jsonMode;
  let includeJsonMode = requestedJsonMode;
  let jsonModeFallbackUsed = false;
  let lastError: AIProviderError | null = null;

  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const { response, payload } = await requestCompletion(
        config,
        messages,
        { model, temperature, timeoutMs, jsonMode: requestedJsonMode },
        includeJsonMode,
      );

      if (!response.ok) {
        // A number of OpenAI-compatible gateways do not implement response_format.
        // Retry that request once without JSON mode before surfacing the provider error.
        if (response.status === 400 && includeJsonMode && !jsonModeFallbackUsed) {
          includeJsonMode = false;
          jsonModeFallbackUsed = true;
          // The compatibility retry is part of the same logical attempt.
          continue;
        }
        throw new AIProviderError(redactSecret(extractErrorMessage(payload, response.status), config.apiKey), {
          status: response.status,
          retryable: isRetryableStatus(response.status),
          code: response.status === 429 ? 'AI_RATE_LIMITED' : 'AI_PROVIDER_ERROR',
        });
      }

      const completion = payload as {
        id?: string;
        model?: string;
        choices?: Array<{ message?: { content?: unknown } }>;
        usage?: ChatCompletionResult['usage'];
      } | null;
      const content = contentToText(completion?.choices?.[0]?.message?.content);
      if (!content) {
        throw new AIProviderError('AI 返回为空，请检查模型是否支持 Chat Completions', {
          code: 'AI_EMPTY_RESPONSE',
          retryable: false,
        });
      }

      return {
        content,
        id: completion?.id,
        model: completion?.model,
        usage: completion?.usage,
        raw: payload,
      };
    } catch (error) {
      lastError = error instanceof AIProviderError
        ? error
        : new AIProviderError('AI 服务调用失败', { retryable: true });
      if (!lastError.retryable || attempt >= maxRetries) throw lastError;
      await backoff(attempt);
      attempt += 1;
    }
  }

  throw lastError || new AIProviderError('AI 服务调用失败');
}

export function getAIErrorStatus(error: unknown): number {
  if (error instanceof AIConfigurationError) return 503;
  if (error instanceof AIProviderError && error.status === 429) return 429;
  if (error instanceof AIProviderError && error.status && error.status >= 400 && error.status < 500) return 502;
  return 502;
}

export function getAIErrorPayload(error: unknown): { code: string; message: string } {
  if (error instanceof AIConfigurationError) return { code: error.code, message: error.message };
  if (error instanceof AIProviderError) return { code: error.code, message: error.message };
  return { code: 'AI_UNKNOWN_ERROR', message: 'AI 服务暂时不可用，请稍后重试' };
}
