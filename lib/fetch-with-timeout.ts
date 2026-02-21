/**
 * Fetch with an 8-second abort timeout so hung Vercel functions don't block indefinitely.
 * Returns a 408 Response on timeout instead of throwing.
 */
export function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), 8000)
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id))
    .catch((err: unknown) => {
      if (err instanceof Error && err.name === 'AbortError') {
        return new Response(null, { status: 408 })
      }
      throw err
    })
}
