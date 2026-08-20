import type { Metadata } from 'next';
import './globals.css';
import './auth.css';
import './detail.css';
import './onboarding/onboarding.css';

export const metadata: Metadata = {
  title: 'FireRanky — Pick what you sell.',
  description: 'Discover commission-based sales opportunities. Fire on the best deals, close, and climb the ranks.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
