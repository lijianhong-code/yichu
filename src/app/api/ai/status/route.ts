import { NextResponse } from 'next/server';
import { getAIConfig, getAIErrorPayload, getSafeProviderUrl } from '@/lib/ai/openai-compatible';

/** Read-only diagnostic endpoint. Never returns the API key. */
export async function GET() {
  try {
    const config = getAIConfig();
    return NextResponse.json({
      configured: true,
      provider: getSafeProviderUrl(config.baseUrl.replace(/\/chat\/completions$/i, '')),
      model: config.model,
      timeoutMs: config.timeoutMs,
      maxRetries: config.maxRetries,
      jsonMode: config.jsonMode,
    });
  } catch (error) {
    const { code, message } = getAIErrorPayload(error);
    return NextResponse.json({ configured: false, code, message }, { status: 503 });
  }
}
