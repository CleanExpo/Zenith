import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ui/theme-provider';
import Navbar from '@/components/layout/Navbar'; // Re-enabled
import Footer from '@/components/layout/Footer'; // Re-enabled
import { Toaster } from "@/components/ui/toaster";
import { SkipLink } from '@/components/ui/skip-link';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Zenith SaaS',
  description: 'Zenith SaaS Application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SkipLink />
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main id="main-content" className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
