import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Zenith Platform - AI-Powered Business Automation',
  description: 'Universal Business Website Automation Platform with Multi-Agent AI System',
  keywords: ['AI', 'automation', 'business', 'website', 'SEO', 'agents', 'SaaS'],
  authors: [{ name: 'Zenith Platform Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Zenith Platform - AI-Powered Business Automation',
    description: 'Universal Business Website Automation Platform with Multi-Agent AI System',
    type: 'website',
    url: 'https://zenithplatform.com',
    siteName: 'Zenith Platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zenith Platform - AI-Powered Business Automation',
    description: 'Universal Business Website Automation Platform with Multi-Agent AI System',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}