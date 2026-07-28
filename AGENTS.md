# 衣橱助手 - 项目指南

## 项目概览
AI智慧衣橱 Web 应用，基于 Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui。
设计语言: Quiet Wardrobe / 静衣 — 简约、精准、温暖但不甜腻。

## 技术栈
- Framework: Next.js 16 (App Router)
- Core: React 19
- Language: TypeScript 5
- UI: shadcn/ui (Radix UI)
- Styling: Tailwind CSS 4
- Icons: lucide-react

## 目录结构
```
src/
── app/
│   ├── wardrobe/page.tsx     # 衣橱页 - 单品管理
│   ├── ai-styling/page.tsx   # 搭配页 - 常驻搭配区+情境化操作
│   ├── calendar/page.tsx     # 日历页 - 周视图/月视图/日期详情
│   ├── profile/page.tsx      # 我的页面 - 偏好与洞察
│   ├── layout.tsx            # 全局布局 + 底部Tab导航
│   ── globals.css           # 设计Token + 全局样式
├── components/
│   ├── ui/                   # shadcn/ui 组件库
│   └── bottom-tab-nav.tsx    # 底部Tab导航组件
├── lib/
│   ├── utils.ts              # 通用工具函数
│   └── mock-data.ts          # Mock数据（衣物、穿搭、日历、用户）
├── hooks/                    # 自定义Hooks
└── test/
    ├── setup.ts              # 测试环境配置
    ├── design-tokens.test.ts # 设计Token规范测试
    ├── mock-data.test.ts     # 数据模型合规测试
    └── prd-compliance.test.ts # PRD功能验收测试
```

## 设计Token
品牌色、AI辅助色、中性色等Token定义在 `src/app/globals.css` 中，详见 `DESIGN.md`。

## 开发命令
- 开发: `pnpm dev`
- 构建: `pnpm build`
- 类型检查: `pnpm ts-check`
- Lint: `pnpm lint`
- 单元测试: `pnpm test`
- 测试监听: `pnpm test:watch`
