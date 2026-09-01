import { describe, expect, it } from 'vitest';
import { wardrobeItems } from '@/lib/mock-data';
import { validateOutfitRecommendations } from '@/lib/ai/validation';

const idForCategory = (category: string) => {
  const item = wardrobeItems.find((candidate) => candidate.category === category && candidate.status === 'available');
  if (!item) throw new Error(`Missing fixture for ${category}`);
  return item.id;
};

describe('outfit recommendation validation', () => {
  it('rejects a recommendation without a complete main outfit', () => {
    const topId = idForCategory('上装');
    const errors = validateOutfitRecommendations([{ item_ids: [topId] }], {});
    expect(errors[0]?.errors).toContain('搭配主体不完整，需要上装+下装或连体服饰');
  });

  it('accepts top plus bottom and enforces locked items', () => {
    const topId = idForCategory('上装');
    const bottomId = idForCategory('下装');
    expect(validateOutfitRecommendations([{ item_ids: [topId, bottomId] }], {})).toEqual([]);

    const errors = validateOutfitRecommendations(
      [{ item_ids: [topId, bottomId] }],
      { locked_item_ids: [idForCategory('鞋')] },
    );
    expect(errors[0]?.errors.some((message) => message.startsWith('缺少锁定衣物'))).toBe(true);
  });
});
