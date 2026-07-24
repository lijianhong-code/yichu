// Mock data for the AI Smart Wardrobe application

export interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  primaryColor: string;
  colors: string[];
  season: string[];
  occasions: string[];
  style: string[];
  material?: string;
  pattern?: string;
  brand?: string;
  status: 'available' | 'washing' | 'lent' | 'pending_review';
  wearCount: number;
  lastWorn?: string;
  imageUrl: string;
  confidence?: number;
}

export interface Outfit {
  id: string;
  name: string;
  items: WardrobeItem[];
  occasion: string;
  style: string;
  season: string;
  source: 'ai_text' | 'ai_reference' | 'manual';
  createdAt: string;
  lastWorn?: string;
  explanation?: string;
  weather?: string;
}

export interface WearLog {
  id: string;
  date: string;
  outfitId?: string;
  items: string[];
  weather: string;
  feedback?: string;
  occasion: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  city: string;
  wardrobeDays: number;
  totalItems: number;
  totalOutfits: number;
  stylePreferences: string[];
  colorPreferences: string[];
  avoidItems: string[];
}

// Generate placeholder clothing images using SVG data URIs
function generateClothingImage(color: string, shape: 'top' | 'bottom' | 'dress' | 'shoe' | 'bag' | 'accessory' | 'jacket'): string {
  const shapes: Record<string, string> = {
    top: `<rect x="25" y="20" width="50" height="45" rx="8" fill="${color}" opacity="0.85"/><rect x="15" y="20" width="15" height="30" rx="4" fill="${color}" opacity="0.7"/><rect x="70" y="20" width="15" height="30" rx="4" fill="${color}" opacity="0.7"/>`,
    bottom: `<rect x="30" y="15" width="40" height="20" rx="4" fill="${color}" opacity="0.85"/><rect x="30" y="35" width="18" height="45" rx="4" fill="${color}" opacity="0.8"/><rect x="52" y="35" width="18" height="45" rx="4" fill="${color}" opacity="0.8"/>`,
    dress: `<rect x="30" y="15" width="40" height="25" rx="6" fill="${color}" opacity="0.85"/><path d="M28 40 L72 40 L68 85 L32 85 Z" fill="${color}" opacity="0.8"/>`,
    shoe: `<ellipse cx="50" cy="60" rx="30" ry="12" fill="${color}" opacity="0.85"/><rect x="20" y="48" width="25" height="14" rx="6" fill="${color}" opacity="0.75"/>`,
    bag: `<rect x="28" y="30" width="44" height="40" rx="6" fill="${color}" opacity="0.85"/><path d="M35 30 Q50 15 65 30" stroke="${color}" stroke-width="3" fill="none" opacity="0.7"/>`,
    accessory: `<circle cx="50" cy="50" r="20" fill="${color}" opacity="0.8"/><circle cx="50" cy="50" r="12" fill="none" stroke="${color}" stroke-width="2" opacity="0.5"/>`,
    jacket: `<rect x="22" y="18" width="56" height="50" rx="6" fill="${color}" opacity="0.85"/><rect x="12" y="18" width="16" height="38" rx="5" fill="${color}" opacity="0.7"/><rect x="72" y="18" width="16" height="38" rx="5" fill="${color}" opacity="0.7"/><line x1="50" y1="18" x2="50" y2="68" stroke="white" stroke-width="1.5" opacity="0.3"/>`,
  };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#F0F2EF"/>${shapes[shape] || shapes.top}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const wardrobeItems: WardrobeItem[] = [
  {
    id: 'item-001',
    name: '白色纯棉T恤',
    category: '上装',
    subCategory: 'T恤',
    primaryColor: '#FFFFFF',
    colors: ['白色'],
    season: ['春夏'],
    occasions: ['日常', '休闲'],
    style: ['简约', '基础'],
    material: '纯棉',
    pattern: '纯色',
    status: 'available',
    wearCount: 23,
    lastWorn: '2026-07-22',
    imageUrl: generateClothingImage('#F5F5F5', 'top'),
    confidence: 0.98,
  },
  {
    id: 'item-002',
    name: '深蓝修身牛仔裤',
    category: '下装',
    subCategory: '长裤',
    primaryColor: '#1B3A5C',
    colors: ['深蓝'],
    season: ['春秋', '秋冬'],
    occasions: ['日常', '通勤'],
    style: ['休闲', '经典'],
    material: '牛仔',
    pattern: '纯色',
    status: 'available',
    wearCount: 18,
    lastWorn: '2026-07-21',
    imageUrl: generateClothingImage('#1B3A5C', 'bottom'),
    confidence: 0.96,
  },
  {
    id: 'item-003',
    name: '黑色西装外套',
    category: '外套',
    subCategory: '西装',
    primaryColor: '#1A1A1A',
    colors: ['黑色'],
    season: ['春秋'],
    occasions: ['商务', '正式', '通勤'],
    style: ['正式', '干练'],
    material: '羊毛混纺',
    pattern: '纯色',
    brand: 'ZARA',
    status: 'available',
    wearCount: 12,
    lastWorn: '2026-07-18',
    imageUrl: generateClothingImage('#1A1A1A', 'jacket'),
    confidence: 0.95,
  },
  {
    id: 'item-004',
    name: '米色针织开衫',
    category: '上装',
    subCategory: '针织',
    primaryColor: '#E8DCC8',
    colors: ['米色', '杏色'],
    season: ['春秋'],
    occasions: ['日常', '约会'],
    style: ['温柔', '文艺'],
    material: '羊毛',
    pattern: '纯色',
    status: 'available',
    wearCount: 8,
    lastWorn: '2026-07-15',
    imageUrl: generateClothingImage('#E8DCC8', 'top'),
    confidence: 0.92,
  },
  {
    id: 'item-005',
    name: '卡其色阔腿裤',
    category: '下装',
    subCategory: '长裤',
    primaryColor: '#C4A97D',
    colors: ['卡其色'],
    season: ['春秋', '夏'],
    occasions: ['日常', '通勤'],
    style: ['休闲', '宽松'],
    material: '棉麻',
    pattern: '纯色',
    status: 'available',
    wearCount: 15,
    lastWorn: '2026-07-20',
    imageUrl: generateClothingImage('#C4A97D', 'bottom'),
    confidence: 0.94,
  },
  {
    id: 'item-006',
    name: '黑色皮质手提包',
    category: '包',
    subCategory: '手提包',
    primaryColor: '#2C2C2C',
    colors: ['黑色'],
    season: ['四季'],
    occasions: ['通勤', '商务', '日常'],
    style: ['经典', '干练'],
    material: '真皮',
    brand: 'COACH',
    status: 'available',
    wearCount: 30,
    lastWorn: '2026-07-23',
    imageUrl: generateClothingImage('#2C2C2C', 'bag'),
    confidence: 0.97,
  },
  {
    id: 'item-007',
    name: '白色帆布运动鞋',
    category: '鞋',
    subCategory: '运动鞋',
    primaryColor: '#F8F8F8',
    colors: ['白色'],
    season: ['春夏秋'],
    occasions: ['日常', '休闲', '运动'],
    style: ['休闲', '运动'],
    material: '帆布',
    pattern: '纯色',
    status: 'available',
    wearCount: 25,
    lastWorn: '2026-07-22',
    imageUrl: generateClothingImage('#F0F0F0', 'shoe'),
    confidence: 0.93,
  },
  {
    id: 'item-008',
    name: '灰色条纹衬衫',
    category: '上装',
    subCategory: '衬衫',
    primaryColor: '#9CA3AF',
    colors: ['灰色', '白色'],
    season: ['春秋', '夏'],
    occasions: ['通勤', '商务休闲'],
    style: ['干练', '简约'],
    material: '棉',
    pattern: '条纹',
    status: 'available',
    wearCount: 10,
    lastWorn: '2026-07-17',
    imageUrl: generateClothingImage('#9CA3AF', 'top'),
    confidence: 0.91,
  },
  {
    id: 'item-009',
    name: '酒红色连衣裙',
    category: '连体',
    subCategory: '连衣裙',
    primaryColor: '#722F37',
    colors: ['酒红'],
    season: ['春秋'],
    occasions: ['约会', '聚会', '正式'],
    style: ['优雅', '气质'],
    material: '聚酯纤维',
    pattern: '纯色',
    status: 'available',
    wearCount: 5,
    lastWorn: '2026-07-10',
    imageUrl: generateClothingImage('#722F37', 'dress'),
    confidence: 0.89,
  },
  {
    id: 'item-010',
    name: '棕色皮质腰带',
    category: '配饰',
    subCategory: '腰带',
    primaryColor: '#8B5E3C',
    colors: ['棕色'],
    season: ['四季'],
    occasions: ['通勤', '商务'],
    style: ['经典'],
    material: '真皮',
    pattern: '纯色',
    status: 'available',
    wearCount: 20,
    lastWorn: '2026-07-21',
    imageUrl: generateClothingImage('#8B5E3C', 'accessory'),
    confidence: 0.96,
  },
  {
    id: 'item-011',
    name: '藏青色风衣',
    category: '外套',
    subCategory: '风衣',
    primaryColor: '#2C3E50',
    colors: ['藏青'],
    season: ['春秋'],
    occasions: ['通勤', '日常'],
    style: ['经典', '干练'],
    material: '棉混纺',
    pattern: '纯色',
    status: 'available',
    wearCount: 7,
    lastWorn: '2026-07-12',
    imageUrl: generateClothingImage('#2C3E50', 'jacket'),
    confidence: 0.94,
  },
  {
    id: 'item-012',
    name: '黑色尖头高跟鞋',
    category: '鞋',
    subCategory: '高跟鞋',
    primaryColor: '#1A1A1A',
    colors: ['黑色'],
    season: ['四季'],
    occasions: ['商务', '正式', '聚会'],
    style: ['优雅', '干练'],
    material: '漆皮',
    pattern: '纯色',
    status: 'available',
    wearCount: 9,
    lastWorn: '2026-07-16',
    imageUrl: generateClothingImage('#1A1A1A', 'shoe'),
    confidence: 0.95,
  },
];

export const outfits: Outfit[] = [
  {
    id: 'outfit-001',
    name: '商务休闲通勤',
    items: [wardrobeItems[2], wardrobeItems[0], wardrobeItems[1], wardrobeItems[5], wardrobeItems[11]],
    occasion: '通勤',
    style: '商务休闲',
    season: '春秋',
    source: 'ai_text',
    createdAt: '2026-07-22',
    lastWorn: '2026-07-22',
    explanation: '黑色西装搭配白T和牛仔裤，正式但不刻板，适合日常通勤',
    weather: '18-24°C 多云',
  },
  {
    id: 'outfit-002',
    name: '周末休闲出行',
    items: [wardrobeItems[3], wardrobeItems[4], wardrobeItems[6]],
    occasion: '日常',
    style: '休闲',
    season: '春夏',
    source: 'ai_text',
    createdAt: '2026-07-20',
    lastWorn: '2026-07-20',
    explanation: '米色针织衫搭配卡其阔腿裤和白色运动鞋，轻松舒适的周末穿搭',
    weather: '24-30°C 晴',
  },
  {
    id: 'outfit-003',
    name: '优雅约会装扮',
    items: [wardrobeItems[8], wardrobeItems[11], wardrobeItems[5]],
    occasion: '约会',
    style: '优雅',
    season: '春秋',
    source: 'ai_reference',
    createdAt: '2026-07-18',
    explanation: '酒红连衣裙搭配黑色高跟鞋和手提包，优雅大方',
    weather: '16-22°C 晴',
  },
  {
    id: 'outfit-004',
    name: '春秋层次感穿搭',
    items: [wardrobeItems[10], wardrobeItems[7], wardrobeItems[1], wardrobeItems[9], wardrobeItems[6]],
    occasion: '通勤',
    style: '经典',
    season: '春秋',
    source: 'manual',
    createdAt: '2026-07-15',
    lastWorn: '2026-07-17',
    explanation: '藏青风衣内搭条纹衬衫，层次分明又保暖',
    weather: '14-20°C 阴',
  },
];

export const wearLogs: WearLog[] = [
  { id: 'log-001', date: '2026-07-23', outfitId: 'outfit-001', items: ['item-006'], weather: '26°C 晴', feedback: '刚好', occasion: '通勤' },
  { id: 'log-002', date: '2026-07-22', outfitId: 'outfit-001', items: ['item-001', 'item-007'], weather: '24°C 多云', feedback: '刚好', occasion: '通勤' },
  { id: 'log-003', date: '2026-07-21', items: ['item-002', 'item-010'], weather: '22°C 阴', occasion: '日常' },
  { id: 'log-004', date: '2026-07-20', outfitId: 'outfit-002', items: ['item-004', 'item-005', 'item-007'], weather: '28°C 晴', feedback: '太热', occasion: '休闲' },
  { id: 'log-005', date: '2026-07-18', items: ['item-003'], weather: '20°C 多云', occasion: '商务' },
  { id: 'log-006', date: '2026-07-17', outfitId: 'outfit-004', items: ['item-011', 'item-008'], weather: '18°C 阴', feedback: '刚好', occasion: '通勤' },
  { id: 'log-007', date: '2026-07-16', items: ['item-012'], weather: '25°C 晴', occasion: '聚会' },
  { id: 'log-008', date: '2026-07-15', items: ['item-004'], weather: '22°C 晴', occasion: '日常' },
];

export const userProfile: UserProfile = {
  name: '小明',
  avatar: '',
  city: '上海',
  wardrobeDays: 45,
  totalItems: 86,
  totalOutfits: 24,
  stylePreferences: ['简约', '商务休闲', '经典'],
  colorPreferences: ['黑色', '白色', '深蓝', '灰色'],
  avoidItems: ['荧光色', '大面积印花'],
};

// AI styling scenarios
export const quickScenarios = [
  { label: '通勤上班', icon: 'briefcase' },
  { label: '约会聚餐', icon: 'heart' },
  { label: '周末出游', icon: 'sun' },
  { label: '商务会议', icon: 'presentation' },
];

// Categories for wardrobe filter
export const categories = [
  { label: '全部', value: 'all' },
  { label: '上装', value: '上装' },
  { label: '下装', value: '下装' },
  { label: '连体', value: '连体' },
  { label: '外套', value: '外套' },
  { label: '鞋', value: '鞋' },
  { label: '包', value: '包' },
  { label: '配饰', value: '配饰' },
];
