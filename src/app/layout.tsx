import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
export const metadata: Metadata = { title: 'Web4browser', description: 'Web4browser desktop companion and Web4 research workspace' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><Providers>{children}</Providers></body></html>; }
