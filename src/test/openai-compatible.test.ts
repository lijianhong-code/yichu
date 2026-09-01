import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AIConfigurationError,
  getAIConfig,
  invokeOpenAI,
  normalizeChatCompletionsUrl,
} from '@/lib/ai/openai-compatible';

const envKeys = [
  'OPENAI_API_KEY',
  'OPENAI_BASE_URL',
  'OPENAI_MODEL',
  'OPENAI_TIMEOUT_MS',
  'OPENAI_MAX_RETRIES',
  'OPENAI_JSON_MODE',
  'AI_API_KEY',
  'AI_BASE_URL',
  'AI_MODEL',
];

const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  vi.unstubAllGlobals();
  for (const key of envKeys) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

describe('OpenAI-compatible client', () => {
  it('normalizes provider root and full endpoint URLs', () => {
    expect(normalizeChatCompletionsUrl('https://api.openai.com/v1/')).toBe(
      'https://api.openai.com/v1/chat/completions',
    );
    expect(normalizeChatCompletionsUrl('https://gateway.test/v1/chat/completions/')).toBe(
      'https://gateway.test/v1/chat/completions',
    );
  });

  it('fails clearly when the server API key is missing', () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_API_KEY;
    expect(() => getAIConfig()).toThrow(AIConfigurationError);
  });

  it('sends bearer auth and parses a Chat Completions response', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_BASE_URL = 'https://gateway.test/v1';
    process.env.OPENAI_MODEL = 'wardrobe-model';
    process.env.OPENAI_MAX_RETRIES = '0';

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.model).toBe('wardrobe-model');
      expect(body.stream).toBe(false);
      expect(body.response_format).toEqual({ type: 'json_object' });
      expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
      return new Response(JSON.stringify({
        id: 'chatcmpl-test',
        model: 'wardrobe-model',
        choices: [{ message: { content: '{"status":"success"}' } }],
        usage: { total_tokens: 12 },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await invokeOpenAI([{ role: 'user', content: '请推荐穿搭' }], { retries: 0 });
    expect(result.content).toBe('{"status":"success"}');
    expect(result.usage?.total_tokens).toBe(12);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back without response_format for gateways that reject JSON mode', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_BASE_URL = 'https://gateway.test/v1';
    process.env.OPENAI_MAX_RETRIES = '0';

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      if (body.response_format) {
        return new Response(JSON.stringify({ error: { message: 'response_format unsupported' } }), { status: 400 });
      }
      return new Response(JSON.stringify({ choices: [{ message: { content: '{}' } }] }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(invokeOpenAI([{ role: 'user', content: 'test' }], { retries: 0 })).resolves.toMatchObject({ content: '{}' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
