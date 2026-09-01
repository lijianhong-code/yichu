/**
 * AI 输出校验层
 * 对 LLM 返回的搭配方案进行确定性校验，确保结果可执行
 */

import { wardrobeItems } from '@/lib/mock-data';

// 衣物槽位定义
export type ClothingSlot = 
  | 'top'        // 上装
  | 'bottom'     // 下装
  | 'onepiece'   // 连体（连衣裙等）
  | 'outerwear'  // 外套
  | 'shoes'      // 鞋
  | 'bag'        // 包
  | 'accessory'  // 配饰
  | '上装'
  | '下装'
  | '连体'
  | '外套'
  | '鞋'
  | '包'
  | '配饰';

// 品类到槽位的映射
export const CATEGORY_TO_SLOT: Record<string, ClothingSlot> = {
  '上装': 'top',
  '下装': 'bottom',
  '连衣裙': 'onepiece',
  '外套': 'outerwear',
  '鞋': 'shoes',
  '包': 'bag',
  '配饰': 'accessory',
};

// 校验错误类型
export interface ValidationError {
  type: 'invalid_id' | 'unavailable' | 'duplicate' | 'missing_must_use' | 'has_avoid' | 'incomplete' | 'schema_error';
  message: string;
  item_id?: string;
  outfit_index?: number;
}

// 校验结果
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

// 校验单个衣物 ID
export function validateItemId(itemId: string): boolean {
  return wardrobeItems.some(item => item.id === itemId);
}

// 校验衣物状态
export function validateItemAvailability(itemId: string): boolean {
  const item = wardrobeItems.find(i => i.id === itemId);
  if (!item) return false;
  return item.status === 'available';
}

// 获取衣物槽位
export function getItemSlot(itemId: string): ClothingSlot | null {
  const item = wardrobeItems.find(i => i.id === itemId);
  if (!item) return null;
  return CATEGORY_TO_SLOT[item.category] || null;
}

// 校验搭配完整性
export function validateOutfitCompleteness(itemIds: string[]): { complete: boolean; missingSlots: ClothingSlot[] } {
  const slots = new Set<ClothingSlot>();
  
  for (const id of itemIds) {
    const slot = getItemSlot(id);
    if (slot) slots.add(slot);
  }
  
  const hasTop = slots.has('top');
  const hasBottom = slots.has('bottom');
  const hasOnepiece = slots.has('onepiece');
  
  // 完整主体：上装+下装 或 一件连体
  const hasCompleteMain = (hasTop && hasBottom) || hasOnepiece;
  
  const missingSlots: ClothingSlot[] = [];
  if (!hasCompleteMain) {
    if (!hasTop && !hasOnepiece) missingSlots.push('top');
    if (!hasBottom && !hasOnepiece) missingSlots.push('bottom');
  }
  
  return { complete: hasCompleteMain, missingSlots };
}

// 校验重复 ID
export function validateNoDuplicates(itemIds: string[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  
  for (const id of itemIds) {
    if (seen.has(id)) {
      duplicates.push(id);
    }
    seen.add(id);
  }
  
  return duplicates;
}

// 校验 must_use 约束
export function validateMustUse(itemIds: string[], mustUseIds: string[]): string[] {
  return mustUseIds.filter(id => !itemIds.includes(id));
}

// 校验 avoid 约束
export function validateAvoid(itemIds: string[], avoidIds: string[]): string[] {
  return avoidIds.filter(id => itemIds.includes(id));
}

// 完整校验一套搭配
export function validateOutfit(
  outfit: { item_ids: string[] },
  constraints: {
    must_use_item_ids?: string[];
    avoid_item_ids?: string[];
    locked_item_ids?: string[];
  },
  outfitIndex: number = 0
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  const { item_ids } = outfit;
  const { must_use_item_ids = [], avoid_item_ids = [], locked_item_ids = [] } = constraints;
  
  // 1. 校验所有 ID 存在
  for (const id of item_ids) {
    if (!validateItemId(id)) {
      errors.push({
        type: 'invalid_id',
        message: `衣物 ${id} 不存在于衣橱中`,
        item_id: id,
        outfit_index: outfitIndex,
      });
    }
  }
  
  // 2. 校验可用性
  for (const id of item_ids) {
    if (!validateItemAvailability(id)) {
      errors.push({
        type: 'unavailable',
        message: `衣物 ${id} 当前不可用`,
        item_id: id,
        outfit_index: outfitIndex,
      });
    }
  }
  
  // 3. 校验无重复
  const duplicates = validateNoDuplicates(item_ids);
  for (const id of duplicates) {
    errors.push({
      type: 'duplicate',
      message: `衣物 ${id} 重复出现`,
      item_id: id,
      outfit_index: outfitIndex,
    });
  }
  
  // 4. 校验 must_use
  const missingMustUse = validateMustUse(item_ids, must_use_item_ids);
  for (const id of missingMustUse) {
    errors.push({
      type: 'missing_must_use',
      message: `必须使用的衣物 ${id} 未包含在搭配中`,
      item_id: id,
      outfit_index: outfitIndex,
    });
  }
  
  // 5. 校验 avoid
  const hasAvoid = validateAvoid(item_ids, avoid_item_ids);
  for (const id of hasAvoid) {
    errors.push({
      type: 'has_avoid',
      message: `应避免的衣物 ${id} 出现在搭配中`,
      item_id: id,
      outfit_index: outfitIndex,
    });
  }
  
  // 6. 校验 locked 保留
  const missingLocked = validateMustUse(item_ids, locked_item_ids);
  for (const id of missingLocked) {
    errors.push({
      type: 'missing_must_use',
      message: `锁定的衣物 ${id} 未保留在搭配中`,
      item_id: id,
      outfit_index: outfitIndex,
    });
  }
  
  // 7. 校验完整性
  const { complete, missingSlots } = validateOutfitCompleteness(item_ids);
  if (!complete) {
    errors.push({
      type: 'incomplete',
      message: `搭配不完整，缺少: ${missingSlots.join(', ')}`,
      outfit_index: outfitIndex,
    });
  }
  
  // 警告：缺少鞋
  if (!item_ids.some(id => getItemSlot(id) === 'shoes')) {
    warnings.push('搭配未包含鞋履');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// 校验多套搭配
export function validateOutfits(
  outfits: Array<{ item_ids: string[] }>,
  constraints: {
    must_use_item_ids?: string[];
    avoid_item_ids?: string[];
    locked_item_ids?: string[];
  }
): ValidationResult[] {
  return outfits.map((outfit, index) => validateOutfit(outfit, constraints, index));
}

// 分槽召回候选衣物
export function recallBySlot(
  slots: ClothingSlot[],
  filters: {
    weather?: { temperature: number; condition: string };
    occasions?: string[];
    excludeIds?: string[];
  } = {}
): Record<ClothingSlot, typeof wardrobeItems> {
  const result: Partial<Record<ClothingSlot, typeof wardrobeItems>> = {};
  const { weather, occasions, excludeIds = [] } = filters;
  
  for (const slot of slots) {
    let candidates = wardrobeItems.filter(item => {
      const itemSlot = CATEGORY_TO_SLOT[item.category];
      return itemSlot === slot && 
             item.status === 'available' &&
             (item.confidence === undefined || item.confidence >= 0.6) &&
             !excludeIds.includes(item.id);
    });
    
    // 天气过滤（简单实现）
    if (weather) {
      const temp = weather.temperature;
      candidates = candidates.filter(item => {
        const seasonStr = item.season.join('');
        if (temp < 10) return seasonStr.includes('秋冬') || seasonStr.includes('春秋');
        if (temp > 25) return seasonStr.includes('春夏') || seasonStr.includes('夏');
        return true; // 适中温度，不过滤
      });
    }
    
    // 场合过滤
    if (occasions && occasions.length > 0) {
      candidates = candidates.filter(item => 
        item.occasions.some(o => occasions.includes(o))
      );
    }
    
    // 限制每个槽位最多 15 件候选
    result[slot] = candidates.slice(0, 15);
  }
  
  return result as Record<ClothingSlot, typeof wardrobeItems>;
}

// 多槽位召回（别名）
export function recallBySlots(
  slots: ClothingSlot[],
  filters: {
    weather?: { temperature: number; condition: string };
    occasions?: string[];
    excludeIds?: string[];
  } = {}
): Record<ClothingSlot, typeof wardrobeItems> {
  return recallBySlot(slots, filters);
}

// 天气信息接口
export interface WeatherInfo {
  temperature?: number;
  temperatureMin?: number;
  temperatureMax?: number;
  condition?: string;
  windLevel?: number;
  humidity?: number;
}

// 获取天气描述
export function getWeatherDescription(weather?: WeatherInfo): string {
  if (!weather) return '未知天气';
  const parts: string[] = [];
  
  // 温度描述
  const temp = weather.temperature ?? weather.temperatureMax;
  if (temp !== undefined) {
    let tempDesc = '';
    if (temp < 0) tempDesc = '严寒';
    else if (temp < 10) tempDesc = '寒冷';
    else if (temp < 18) tempDesc = '凉爽';
    else if (temp < 25) tempDesc = '舒适';
    else if (temp < 32) tempDesc = '温暖';
    else tempDesc = '炎热';
    parts.push(tempDesc);
  }
  
  // 温度范围
  if (weather.temperatureMin !== undefined && weather.temperatureMax !== undefined) {
    parts.push(`${weather.temperatureMin}-${weather.temperatureMax}℃`);
  } else if (weather.temperature !== undefined) {
    parts.push(`${weather.temperature}℃`);
  }
  
  // 天气状况
  if (weather.condition) parts.push(weather.condition);
  if (weather.windLevel) parts.push(`${weather.windLevel}级风`);
  if (weather.humidity) parts.push(`湿度${weather.humidity}%`);
  
  return parts.join('，') || '未知天气';
}

// 搭配推荐验证（用于推荐API）
export interface RecommendationValidationError {
  outfitIndex: number;
  errors: string[];
}

export function validateOutfitRecommendations(
  outfits: Array<{ item_ids: string[]; items?: Array<{ item_id: string }> }>,
  constraints: {
    must_use_item_ids?: string[];
    avoid_item_ids?: string[];
    locked_item_ids?: string[];
    allowed_item_ids?: string[];
  }
): RecommendationValidationError[] {
  const errors: RecommendationValidationError[] = [];
  
  outfits.forEach((outfit, index) => {
    const itemIds = outfit.item_ids || outfit.items?.map(i => i.item_id) || [];
    const outfitErrors: string[] = [];
    
    // 检查 ID 是否存在
    const invalidIds = itemIds.filter(id => !wardrobeItems.find(item => item.id === id));
    if (invalidIds.length > 0) {
      outfitErrors.push(`不存在衣物 ID: ${invalidIds.join(', ')}`);
    }
    
    // 检查重复
    const duplicates = itemIds.filter((id, i) => itemIds.indexOf(id) !== i);
    if (duplicates.length > 0) {
      outfitErrors.push(`重复衣物: ${duplicates.join(', ')}`);
    }
    
    // 检查 must_use
    if (constraints.must_use_item_ids) {
      const missing = constraints.must_use_item_ids.filter(id => !itemIds.includes(id));
      if (missing.length > 0) {
        outfitErrors.push(`缺少必须使用: ${missing.join(', ')}`);
      }
    }
    
    // 检查 avoid
    if (constraints.avoid_item_ids) {
      const present = constraints.avoid_item_ids.filter(id => itemIds.includes(id));
      if (present.length > 0) {
        outfitErrors.push(`包含禁用衣物: ${present.join(', ')}`);
      }
    }
    
    // 检查 allowed（候选范围）
    if (constraints.allowed_item_ids) {
      const notAllowed = itemIds.filter(id => !constraints.allowed_item_ids!.includes(id));
      if (notAllowed.length > 0) {
        outfitErrors.push(`超出候选范围: ${notAllowed.join(', ')}`);
      }
    }
    
    // 检查状态
    const unavailable = itemIds.filter(id => {
      const item = wardrobeItems.find(i => i.id === id);
      return !item || item.status !== 'available';
    });
    if (unavailable.length > 0) {
      outfitErrors.push(`衣物不可用: ${unavailable.join(', ')}`);
    }

    // 检查主体完整性：上装+下装或连体服饰。鞋、包和配饰为可选层。
    const slots = new Set(
      itemIds
        .map(id => getItemSlot(id))
        .filter((slot): slot is ClothingSlot => Boolean(slot)),
    );
    if (!(slots.has('onepiece') || (slots.has('top') && slots.has('bottom')))) {
      outfitErrors.push('搭配主体不完整，需要上装+下装或连体服饰');
    }

    // 锁定单品和必须单品都属于硬约束，不能只依赖模型自报状态。
    if (constraints.locked_item_ids) {
      const missingLocked = constraints.locked_item_ids.filter(id => !itemIds.includes(id));
      if (missingLocked.length > 0) {
        outfitErrors.push(`缺少锁定衣物: ${missingLocked.join(', ')}`);
      }
    }
    
    if (outfitErrors.length > 0) {
      errors.push({ outfitIndex: index, errors: outfitErrors });
    }
  });
  
  return errors;
}

// 修复搭配推荐结果
export async function fixOutfitRecommendations(
  outfits: Array<{ item_ids: string[]; [key: string]: unknown }>,
  validationErrors: RecommendationValidationError[],
  allowedItemIds: string[]
): Promise<Array<{ item_ids: string[]; [key: string]: unknown }>> {
  return fixOutfits(outfits, validationErrors, allowedItemIds);
}

// 修复搭配（用于修复Prompt）
export async function fixOutfits(
  outfits: Array<{ item_ids: string[]; [key: string]: unknown }>,
  validationErrors: RecommendationValidationError[],
  allowedItemIds: string[]
): Promise<Array<{ item_ids: string[]; [key: string]: unknown }>> {
  // 简单修复：移除无效ID
  const fixed = outfits.map((outfit, index) => {
    const error = validationErrors.find(e => e.outfitIndex === index);
    if (!error) return outfit;
    
    // 过滤掉无效的ID
    const validIds = outfit.item_ids.filter(id => 
      allowedItemIds.includes(id) && 
      wardrobeItems.find(item => item.id === id)?.status === 'available'
    );
    
    return { ...outfit, item_ids: validIds };
  });
  
  return fixed;
}
