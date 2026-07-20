// Production counterpart to the dev-server proxy in vite.config.ts. Vercel
// rewrites /td/* here (see vercel.json); this forwards the request to Twelve
// Data with the API key injected server-side, so TWELVE_DATA_API_KEY never
// reaches the browser. Set it in the Vercel project's environment variables
// (no VITE_ prefix).
export const config = { runtime: 'edge' }

const UPSTREAM = 'https://api.twelvedata.com'

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  // Strip everything up to and including the /td/ segment, whether the path
  // arrives rewritten (/api/td/…) or direct (/td/…).
  const suffix = url.pathname.replace(/^.*?\/td\//, '')
  const target = `${UPSTREAM}/${suffix}${url.search}`

  const upstream = await fetch(target, {
    headers: {
      Authorization: `apikey ${process.env.TWELVE_DATA_API_KEY ?? ''}`,
    },
  })

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'content-type':
        upstream.headers.get('content-type') ?? 'application/json',
      // Twelve Data data is cacheable briefly; mirrors the client's 60s TTL.
      'cache-control': 'public, max-age=60',
    },
  })
}
