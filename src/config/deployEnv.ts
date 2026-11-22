// Which deployment this build is: the host's own answer, worked out once at build time
// (next.config.ts bakes it in as DEPLOY_ENV / DEPLOY_ORIGIN). Netlify's CONTEXT and deploy URLs
// only exist during the build, not when a request is served, so they can't be read later.
// No imports here: next.config.ts loads this file directly.

type Env = Record<string, string | undefined>

/** 'production' only on the host's production deployment; local is undefined, so never production. */
export function deployEnv(env: Env): 'production' | 'preview' | undefined {
  // Vercel: VERCEL_ENV = production | preview | development
  if (env.VERCEL_ENV) return env.VERCEL_ENV === 'production' ? 'production' : 'preview'
  // Netlify: CONTEXT = production | deploy-preview | branch-deploy | dev
  if (env.NETLIFY === 'true' && env.CONTEXT && env.CONTEXT !== 'dev') {
    return env.CONTEXT === 'production' ? 'production' : 'preview'
  }
  return undefined
}

/** This deployment's own address (a preview's or branch's URL), without a trailing slash. */
export function deployOrigin(env: Env): string | undefined {
  const url = env.VERCEL_BRANCH_URL
    ? `https://${env.VERCEL_BRANCH_URL}`
    : env.VERCEL_URL
      ? `https://${env.VERCEL_URL}`
      : env.NETLIFY === 'true'
        ? env.DEPLOY_PRIME_URL || env.URL
        : undefined
  return url ? url.replace(/\/+$/, '') : undefined
}
