import type { NextConfig } from 'next'
import { deployEnv, deployOrigin } from './src/config/deployEnv'

// Worked out once, during the build: the host's variables for this aren't all there at request time.
const DEPLOY_ENV = deployEnv(process.env)

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Only these are sent to the browser. The publishable key is safe to ship (row-level
  // security guards the data). SUPABASE_SECRET_KEY is deliberately NOT listed — it must
  // never reach client code. DEPLOY_ENV / DEPLOY_ORIGIN say which deployment this is (not secrets).
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    DEPLOY_ENV,
    DEPLOY_ORIGIN: deployOrigin(process.env),
  },
  // Search engines only index production (https://DOMAIN, src/config/site.ts). Every other deployment — dev, previews,
  // the host's own *.netlify.app / *.vercel.app addresses, local — answers noindex on every response; production keeps the API and /admin out too.
  async headers() {
    const noindex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
    if (DEPLOY_ENV !== 'production') return [{ source: '/:path*', headers: noindex }]
    return [
      { source: '/api/:path*', headers: noindex },
      { source: '/admin', headers: noindex },
    ]
  },
}

export default nextConfig
