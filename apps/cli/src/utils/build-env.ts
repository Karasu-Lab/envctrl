/** Known CI/CD providers that supply their own environment context. */
export type BuildProvider = 'vercel' | 'netlify' | 'railway';

/** Result of probing the current process environment for a CI/CD context. */
export interface DetectedBuildEnv {
  /** The provider that was identified, or `null` when no provider is detected. */
  readonly provider: BuildProvider | null;
  /**
   * The canonical environment name derived from the provider's own variables.
   * `null` when no provider is detected.
   */
  readonly environment: 'production' | 'development' | null;
}

/**
 * Inspects `process.env` for well-known CI/CD provider variables and maps
 * them to a canonical `production` / `development` environment name.
 *
 * - **Vercel** – `VERCEL=1`; `VERCEL_ENV` is `production` | `preview` | `development`
 * - **Netlify** – `NETLIFY=true`; `CONTEXT` is `production` | `deploy-preview` | `branch-deploy` | `dev`
 * - **Railway** – `RAILWAY_ENVIRONMENT_NAME` holds the environment name directly
 */
export function detectBuildEnvironment(): DetectedBuildEnv {
  if (process.env['VERCEL'] === '1') {
    const vercelEnv = process.env['VERCEL_ENV'];
    return {
      provider: 'vercel',
      environment: vercelEnv === 'production' ? 'production' : 'development',
    };
  }

  if (process.env['NETLIFY'] === 'true') {
    const context = process.env['CONTEXT'];
    return {
      provider: 'netlify',
      environment: context === 'production' ? 'production' : 'development',
    };
  }

  if (process.env['RAILWAY_ENVIRONMENT_NAME'] !== undefined) {
    const railwayEnv = process.env['RAILWAY_ENVIRONMENT_NAME'];
    return {
      provider: 'railway',
      environment: railwayEnv === 'production' ? 'production' : 'development',
    };
  }

  return { provider: null, environment: null };
}
