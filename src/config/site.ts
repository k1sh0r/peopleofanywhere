// YOUR CITY. The public face of the site: its city, address, name and what search engines may do with it.
// Making your own city starts here (see README.md).

/** The city the game is set in. Shown in the HUD, the intro, the share card and place labels ("Design Quarter, Anywhere"). */
export const CITY_NAME = 'Anywhere'

/** The city runs on its real local clock (IANA time zone), wherever the player is: day, golden hour, night. */
export const TIME_ZONE = 'UTC'

/** Dates, times and money are formatted for this locale. */
export const LOCALE = 'en'

/** Money in minor units (cents), as app_settings.application_fee stores it: { amount: 1000, currency: 'USD' } → "$10". */
export const formatMoney = (m: { amount: number; currency: string }) =>
  new Intl.NumberFormat(LOCALE, { style: 'currency', currency: m.currency, maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(m.amount / 100)

/**
 * Country calling code for phone numbers typed without one (the optional WhatsApp number on an application),
 * e.g. '44' → "07700 900123" becomes "+447700900123". Empty: a number must start with +country.
 */
export const DEFAULT_COUNTRY_CODE = ''

// DEPLOY_ENV is baked in at build time (next.config.ts, src/config/deployEnv.ts).

/** Your domain. Production is https://DOMAIN; dev.DOMAIN is staging; admin.DOMAIN / dev.admin.DOMAIN are the review pages. */
export const DOMAIN = 'example.com'

/** The one address search engines should know. Every other host (dev, previews, *.netlify.app) is noindex. */
export const SITE_URL = `https://${DOMAIN}`

/** The review queue lives on its own subdomain (src/proxy.ts): production, dev (staging data), and local (admin.localhost). */
export const ADMIN_HOSTS = [`admin.${DOMAIN}`, `dev.admin.${DOMAIN}`, 'admin.localhost']

/** The game this page belongs to (browser only): admin.x → x, dev.admin.x → dev.x (same scheme and port), else this origin. */
export function gameOrigin() {
  const { hostname: h, protocol, port } = window.location
  if (!ADMIN_HOSTS.includes(h)) return window.location.origin
  return `${protocol}//${h.replace(/^(dev\.)?admin\./, '$1')}${port ? `:${port}` : ''}`
}

/** The public sites' hosts, where /admin doesn't exist. */
export const PUBLIC_HOSTS = [DOMAIN, `www.${DOMAIN}`, `dev.${DOMAIN}`]

export const SITE_NAME = 'People of Anywhere'

export const SITE_TITLE = 'People of Anywhere — walk the city, meet its designers and builders'

export const SITE_DESCRIPTION =
  'A stylised 3D city you can walk through. Every character is a real designer or builder: find them around the city, see what they’re building, and say hi.'

/** Google Analytics 4 measurement ID. Loads only on production (see ANALYTICS_ON). */
export const GA_ID = ''

/**
 * True only on the host's production deployment (https://DOMAIN). Dev, previews and local
 * are never indexed and never send analytics. Baked in at build time (src/config/deployEnv.ts).
 */
export const IS_PRODUCTION = process.env.DEPLOY_ENV === 'production'

export const ANALYTICS_ON = IS_PRODUCTION && !!GA_ID
