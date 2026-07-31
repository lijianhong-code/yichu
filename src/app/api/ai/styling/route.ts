import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { wardrobeItems, weatherContext } from '@/lib/mock-data';

// Build a compact wardrobe summary for the LLM prompt
function buildWardrobeSummary() {
  return wardrobeItems
    .filter((item) => item.status === 'available')
    .map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      subCategory: item.subCategory,
      colors: item.colors,
      season: item.season,
      occasions: item.occasions,
      style: item.style,
      material: item.material,
    }));
}

const SYSTEM_PROMPT = `你是一位专业的穿搭顾问 AI。你的任务是根据用户的需求、当前天气和用户的真实衣橱，生成 3 套不同风格的搭配方案。

## 规则
1. 只能从提供的衣橱列表中选择单品，不能推荐不存在的衣物
2. 每套方案必须包含上装和下装，可以包含外套、鞋、包、配饰
3. 3 套方案应有明确差异化：稳妥/轻松/更有风格
4. 考虑天气温度选择合适的材质和层次
5. 考虑场合匹配度
6. 每套方案需要简短的搭配理由

## 输出格式
严格输出 JSON，不要包含任何其他文字：
\`\`\`json
{
  "candidates": [
    {
      "label": "稳妥通勤",
      "itemIds": ["item-001", "item-002", "item-009"],
      "explanation": "白色衬衫搭配深蓝西裤，简洁干练，适合商务场合",
      "occasion": "通勤",
      "style": "商务休闲"
    },
    {
      "label": "更轻松",
      "itemIds": ["item-008", "item-005", "item-007"],
      "explanation": "条纹T恤搭配工装裤和运动鞋，轻松舒适",
      "occasion": "日常",
      "style": "休闲"
    },
    {
      "label": "更有风格",
      "itemIds": ["item-012", "item-013", "item-008", "item-010"],
      "explanation": "高领毛衣搭配阔腿裤，优雅大方",
      "occasion": "约会",
      "style": "优雅"
    }
  ]
}
\`\`\`

注意：
- itemIds 必须是衣橱中真实存在的单品 ID
- 每套方案 2-5 件单品
- label 控制在 2-4 个字
- explanation 控制在 30 字以内`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userInput, occasion, existingItemIds } = body;

    const wardrobe = buildWardrobeSummary();
    const weather = `${weatherContext.city} ${weatherContext.tempRange} ${weatherContext.condition}`;

    // Build user message
    let userMessage = `当前天气：${weather}\n\n`;
    userMessage += `可用衣橱（${wardrobe.length} 件）：\n${JSON.stringify(wardrobe)}\n\n`;

    if (existingItemIds && existingItemIds.length > 0) {
      userMessage += `用户已选单品 ID：${existingItemIds.join(', ')}，请保留这些单品并补充其他品类。\n\n`;
    }

    userMessage += `用户需求：${userInput || '根据天气和当前日期推荐日常穿搭'}`;

    if (occasion) {
      userMessage += `\n场合：${occasion}`;
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: userMessage },
    ];

    const response = await client.invoke(messages, {
      model: 'doubao-seed-2-0-mini-260215',
      temperature: 0.7,
    });

    // Parse the JSON response
    let content = response.content.trim();
    // Remove markdown code block if present
    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(content);

    // Validate and enrich candidates with full item data
    const candidates = (parsed.candidates || []).map((candidate: { label: string; itemIds: string[]; explanation: string; occasion: string; style: string }, idx: number) => {
      const items = (candidate.itemIds || [])
        .map((id: string) => wardrobeItems.find((w) => w.id === id))
        .filter(Boolean);

      return {
        id: `ai-candidate-${idx + 1}`,
        label: candidate.label || `方案${idx + 1}`,
        outfit: {
          id: `outfit-ai-${Date.now()}-${idx + 1}`,
          name: candidate.label || `AI 方案 ${idx + 1}`,
          items,
          occasion: candidate.occasion || '日常',
          style: candidate.style || '休闲',
          season: weatherContext.tempRange,
          source: 'ai_text' as const,
          createdAt: new Date().toISOString().split('T')[0],
          explanation: candidate.explanation || '',
          weather: `${weatherContext.tempRange} ${weatherContext.condition}`,
        },
      };
    });

    return NextResponse.json({ success: true, candidates });
  } catch (error) {
    console.error('[AI Styling] Error:', error);

    // Fallback: return mock candidates if AI fails
    const { todayOutfit } = require('@/lib/mock-data');
    const fallbackCandidates = [
      {
        id: 'fallback-1',
        label: '稳妥通勤',
        outfit: todayOutfit,
      },
      {
        id: 'fallback-2',
        label: '更轻松',
        outfit: {
          ...todayOutfit,
          name: '轻松休闲风',
          explanation: '针织衫搭配休闲裤，舒适又不失体面。',
          items: todayOutfit.items.slice(0, 3),
        },
      },
      {
        id: 'fallback-3',
        label: '更有风格',
        outfit: {
          ...todayOutfit,
          name: '时尚搭配',
          explanation: '衬衫搭配高腰裤与皮鞋，经典配色中融入个性细节。',
          items: [todayOutfit.items[0], todayOutfit.items[2], todayOutfit.items[3]],
        },
      },
    ];

    return NextResponse.json({
      success: false,
      error: 'AI 生成失败，使用默认方案',
      candidates: fallbackCandidates,
    });
  }
}
