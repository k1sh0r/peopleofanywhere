import { describe, expect, it } from 'vitest'
import { deployEnv, deployOrigin } from './deployEnv'

describe('deployEnv', () => {
  it('is undefined locally, so local is never production', () => {
    expect(deployEnv({})).toBeUndefined()
    expect(deployEnv({ NETLIFY: 'true', CONTEXT: 'dev' })).toBeUndefined()
  })
  it('reads Vercel', () => {
    expect(deployEnv({ VERCEL_ENV: 'production' })).toBe('production')
    expect(deployEnv({ VERCEL_ENV: 'preview' })).toBe('preview')
    expect(deployEnv({ VERCEL_ENV: 'development' })).toBe('preview')
  })
  it('reads Netlify', () => {
    expect(deployEnv({ NETLIFY: 'true', CONTEXT: 'production' })).toBe('production')
    expect(deployEnv({ NETLIFY: 'true', CONTEXT: 'deploy-preview' })).toBe('preview')
    expect(deployEnv({ NETLIFY: 'true', CONTEXT: 'branch-deploy' })).toBe('preview')
  })
  it('ignores a stray CONTEXT that is not from Netlify', () => {
    expect(deployEnv({ CONTEXT: 'production' })).toBeUndefined()
  })
})

describe('deployOrigin', () => {
  it('is undefined locally', () => {
    expect(deployOrigin({})).toBeUndefined()
    expect(deployOrigin({ URL: 'https://example.com' })).toBeUndefined()
  })
  it('prefers the branch address on Vercel', () => {
    expect(deployOrigin({ VERCEL_BRANCH_URL: 'a-git-dev.vercel.app', VERCEL_URL: 'a-123.vercel.app' })).toBe('https://a-git-dev.vercel.app')
    expect(deployOrigin({ VERCEL_URL: 'a-123.vercel.app' })).toBe('https://a-123.vercel.app')
  })
  it('uses the deploy address on Netlify, without a trailing slash', () => {
    expect(deployOrigin({ NETLIFY: 'true', DEPLOY_PRIME_URL: 'https://deploy-preview-4--anywhere.netlify.app/', URL: 'https://example.com' })).toBe('https://deploy-preview-4--anywhere.netlify.app')
    expect(deployOrigin({ NETLIFY: 'true', URL: 'https://example.com' })).toBe('https://example.com')
  })
})
