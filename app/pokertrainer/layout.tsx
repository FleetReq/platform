import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Poker Trainer',
  description: 'Practice pot odds, outs, and equity calculations at the table',
  manifest: '/pokertrainer-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Poker Trainer',
  },
}

export default function PokerTrainerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
