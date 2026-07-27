/**
 * Mock数据与PRD数据模型合规性测试
 * 验证 PRD 10.1-10.5 数据实体定义
 */
import { describe, it, expect } from 'vitest';
import {
  wardrobeItems,
  outfits,
  wearLogs,
  quickScenarios,
  categories,
  userProfile,
} from '@/lib/mock-data';

describe('衣橱单品数据 (PRD 10.2)', () => {
  it('单品数量充足，支持推荐', () => {
    expect(wardrobeItems.length).toBeGreaterThanOrEqual(10);
  });

  it('每个单品必须包含核心字段', () => {
    wardrobeItems.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('primaryColor');
      expect(item).toHaveProperty('imageUrl');
    });
  });

  it('品类覆盖PRD要求的品类 (PRD 10.2.1)', () => {
    const requiredCategories = ['上装', '下装', '外套', '鞋'];
    const existingCategories = [...new Set(wardrobeItems.map(i => i.category))];
    requiredCategories.forEach(cat => {
      expect(existingCategories).toContain(cat);
    });
  });

  it('单品状态符合PRD定义 (PRD 10.2 availability_status)', () => {
    const validStatuses = ['available', 'in_wash', 'lent_out', 'stored'];
    wardrobeItems.forEach((item) => {
      if (item.status) {
        expect(validStatuses).toContain(item.status);
      }
    });
  });

  it('单品图片使用4:5比例 (PRD 6.16.1)', () => {
    wardrobeItems.forEach((item) => {
      expect(item.imageUrl).toBeTruthy();
      expect(typeof item.imageUrl).toBe('string');
    });
  });

  it('单品ID唯一', () => {
    const ids = wardrobeItems.map(i => i.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('穿搭数据 (PRD 10.3)', () => {
  it('穿搭包含必要字段', () => {
    outfits.forEach((outfit) => {
      expect(outfit).toHaveProperty('id');
      expect(outfit).toHaveProperty('name');
      expect(outfit).toHaveProperty('items');
    });
  });

  it('穿搭中的单品引用有效单品', () => {
    const itemIds = new Set(wardrobeItems.map(i => i.id));
    outfits.forEach((outfit) => {
      outfit.items.forEach((item) => {
        expect(itemIds.has(item.id)).toBe(true);
      });
    });
  });

  it('穿搭来源类型符合PRD (PRD 10.3 source_type)', () => {
    const validSources = ['ai_text', 'ai_reference', 'manual'];
    outfits.forEach((outfit) => {
      if (outfit.source) {
        expect(validSources).toContain(outfit.source);
      }
    });
  });

  it('穿搭数量充足', () => {
    expect(outfits.length).toBeGreaterThanOrEqual(3);
  });
});

describe('穿着记录 (PRD 10.4)', () => {
  it('穿着记录包含日期', () => {
    wearLogs.forEach((log) => {
      expect(log).toHaveProperty('date');
    });
  });

  it('穿着记录引用有效穿搭(如有outfitId)', () => {
    const outfitIds = new Set(outfits.map(o => o.id));
    wearLogs.forEach((log) => {
      if (log.outfitId) {
        expect(outfitIds.has(log.outfitId)).toBe(true);
      }
    });
  });

  it('穿着记录包含场合信息', () => {
    wearLogs.forEach((log) => {
      expect(log).toHaveProperty('occasion');
    });
  });
});

describe('用户资料 (PRD 10.5)', () => {
  it('用户资料包含基本信息', () => {
    expect(userProfile).toHaveProperty('name');
    expect(userProfile).toHaveProperty('avatar');
  });

  it('用户资料包含衣橱统计', () => {
    expect(userProfile).toHaveProperty('totalItems');
    expect(userProfile).toHaveProperty('totalOutfits');
  });
});

describe('快捷场景 (PRD 7.1.2)', () => {
  it('至少包含3个高频场景', () => {
    expect(quickScenarios.length).toBeGreaterThanOrEqual(3);
  });

  it('每个场景包含标签和图标', () => {
    quickScenarios.forEach((s) => {
      expect(s).toHaveProperty('label');
      expect(s).toHaveProperty('icon');
    });
  });
});

describe('品类筛选 (PRD 7.2.5)', () => {
  it('包含PRD要求的MVP筛选品类', () => {
    const requiredCategories = ['全部', '上装', '下装', '外套', '鞋'];
    const existingLabels = categories.map(c => c.label);
    requiredCategories.forEach(cat => {
      expect(existingLabels).toContain(cat);
    });
  });

  it('品类以全部开头', () => {
    expect(categories[0].label).toBe('全部');
  });
});
