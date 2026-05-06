import './globals.css';
import type { ReactNode } from 'react';
import { Inter, Lora } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata = {
  title: 'Flag-from-Lyric. COMPLIT 156',
  description:
    'A computational literary experiment that transforms a lyric into formal features, matches them against a country flag, and renders the result as heraldic blazon.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body
        className="min-h-screen"
        style={{ fontFamily: "var(--font-inter), ui-sans-serif, system-ui, -apple-system, sans-serif" }}
      >
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>

        <footer className="mt-16 border-t border-[#9B2020]/[0.12]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
            <span className="text-xs text-white/18">COMPLIT 156 · Flag-from-Lyric</span>
            <span className="text-xs text-white/18">lyric, features, flag, blazon</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
