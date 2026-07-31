import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { wardrobeItems, weatherContext } from '@/lib/mock-data';

const SYSTEM_PROMPT = `你是一位专业的穿搭顾问 AI。用户已经选择了一些衣物单品，你需要根据已有单品，从衣橱中推荐补充缺失品类的单品。

## 规则
1. 只能从提供的衣橱列表中选择，不能推荐不存在的衣物
2. 不能选择用户已有的单品 ID
3. 优先补充核心品类：上装、下装、鞋
4. 考虑颜色协调和风格统一
5. 推荐 1-3 件补充单品

## 输出格式
严格输出 JSON：
\`\`\`json
{
  "suggestions": [
    {
      "id": "item-007",
      "reason": "白色运动鞋与现有搭配风格统一，增添休闲感"
    }
  ]
}
\`\`\``;

export async function POST(request: NextRequest) {
  let currentItemIds: string[] = [];
  try {
    const body = await request.json();
    currentItemIds = body.currentItemIds || [];

    if (!currentItemIds || currentItemIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: '没有当前单品',
        suggestions: [],
      });
    }

    // Get current items and determine missing categories
    const currentItems = wardrobeItems.filter((w) => currentItemIds.includes(w.id));
    const currentCategories = new Set(currentItems.map((i) => i.category));
    const allCategories = ['上装', '下装', '外套', '鞋', '包', '配饰'];
    const missingCategories = allCategories.filter((c) => !currentCategories.has(c));

    // Get available items that are not already selected
    const availableItems = wardrobeItems
      .filter((item) => item.status === 'available' && !currentItemIds.includes(item.id))
      .map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        subCategory: item.subCategory,
        colors: item.colors,
        style: item.style,
        material: item.material,
      }));

    const weather = `${weatherContext.city} ${weatherContext.tempRange} ${weatherContext.condition}`;

    const userMessage = `当前天气：${weather}\n\n已选单品：\n${JSON.stringify(currentItems.map((i) => ({ id: i.id, name: i.name, category: i.category, colors: i.colors, style: i.style })))}\n\n缺失品类：${missingCategories.join('、') || '无'}\n\n可补充的衣橱单品：\n${JSON.stringify(availableItems)}\n\n请推荐补充单品。`;

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: userMessage },
    ];

    const response = await client.invoke(messages, {
      model: 'doubao-seed-2-0-mini-260215',
      temperature: 0.5,
    });

    let content = response.content.trim();
    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(content);

    // Enrich suggestions with full item data
    const suggestions = (parsed.suggestions || [])
      .map((s: { id: string; reason: string }) => {
        const item = wardrobeItems.find((w) => w.id === s.id);
        if (!item) return null;
        return { item, reason: s.reason || '' };
      })
      .filter(Boolean);

    return NextResponse.json({ success: true, suggestions });
  } catch (error) {
    console.error('[AI Complete] Error:', error);

    // Fallback: simple category-based completion
    const currentItems = wardrobeItems.filter((w) => currentItemIds.includes(w.id));
    const currentCategories = new Set(currentItems.map((i) => i.category));

    const fallbackSuggestions: { item: typeof wardrobeItems[0]; reason: string }[] = [];
    const neededCategories = ['下装', '鞋'].filter((c) => !currentCategories.has(c));

    for (const cat of neededCategories) {
      const candidate = wardrobeItems.find(
        (w) => w.category === cat && w.status === 'available' && !currentItemIds.includes(w.id)
      );
      if (candidate) {
        fallbackSuggestions.push({
          item: candidate,
          reason: `补充${cat}品类`,
        });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'AI 补全失败，使用规则匹配',
      suggestions: fallbackSuggestions,
    });
  }
}
