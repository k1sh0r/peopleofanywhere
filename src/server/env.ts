import 'server-only'
import { DOMAIN, SITE_URL } from '@/config/site'

/**
 * True only on the host's production deployment (Netlify or Vercel). DEPLOY_ENV is baked in at
 * build time from the host's own variables (src/config/deployEnv.ts); locally it's unset, so local
 * and previews are never production.
 */
export function isProduction() {
  return process.env.DEPLOY_ENV === 'production'
}

/** Our own site addresses (DOMAIN in src/lib/site.ts). Not secrets — DEPLOY_ORIGIN is this deployment's own address. */
const PRODUCTION_URL = SITE_URL
const KNOWN = [
  PRODUCTION_URL,
  `https://www.${DOMAIN}`,
  `https://dev.${DOMAIN}`,
  'http://localhost:3000',
  process.env.DEPLOY_ORIGIN,
].filter(Boolean) as string[]

/**
 * Where links in emails point. The request's Origin header is only used when it's one of
 * ours — otherwise anyone could make our emails link to their own site.
 */
export function siteOrigin(req: Request) {
  const o = req.headers.get('origin')
  if (o && KNOWN.includes(o)) return o
  // sent from the admin page: link to that database's game, never the admin
  if (o === `https://admin.${DOMAIN}`) return PRODUCTION_URL
  if (o === `https://dev.admin.${DOMAIN}`) return `https://dev.${DOMAIN}`
  if (o === 'http://admin.localhost:3000') return 'http://localhost:3000'
  if (process.env.DEPLOY_ORIGIN && !isProduction()) return process.env.DEPLOY_ORIGIN
  return PRODUCTION_URL
}
