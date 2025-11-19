// Force dynamic rendering to prevent static pre-rendering
export const dynamic = 'force-dynamic'

export default function MileageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
