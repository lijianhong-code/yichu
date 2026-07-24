import type { Metadata } from 'next';
import './globals.css';
import { BottomTabNav } from '@/components/bottom-tab-nav';

export const metadata: Metadata = {
  title: '衣橱助手 - AI智慧衣橱',
  description: '基于你的真实衣橱，20秒内给出今天能直接穿的搭配方案',
  keywords: ['AI', '智慧衣橱', '穿搭', '搭配', '时尚'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-neutral-25 antialiased">
        <main className="mx-auto max-w-lg pb-20">
          {children}
        </main>
        <BottomTabNav />
      </body>
    </html>
  );
}
