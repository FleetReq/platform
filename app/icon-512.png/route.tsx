import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: '#2563eb',
          borderRadius: 96,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: 'white', fontSize: 260, fontWeight: 900, letterSpacing: '-10px' }}>
          FR
        </span>
      </div>
    ),
    {
      width: 512,
      height: 512,
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    }
  )
}
