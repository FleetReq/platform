import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Raise the Shark',
  description: 'Practice pot odds, outs, and equity calculations at the table',
  manifest: '/pokertrainer-manifest.json',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🃏</text></svg>",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Raise the Shark',
  },
}

export default function PokerTrainerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
