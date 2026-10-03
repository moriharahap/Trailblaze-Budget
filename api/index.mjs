/**
 * Vercel serverless function for the whole API.
 *
 * `vercel.json` rewrites every `/api/*` request here, and the original request
 * path is preserved, so the Express router (mounted at `/api` in app.ts)
 * matches exactly as it does on a long-lived server.
 *
 * The handler is the prebuilt esbuild bundle rather than TypeScript source:
 * the API imports workspace packages (`@workspace/db`, `@workspace/api-zod`)
 * whose package exports point at `.ts` files, which the platform's own
 * bundler cannot resolve. `vercel.json`'s buildCommand produces this file
 * before functions are collected.
 */
export { default } from '../artifacts/api-server/dist/serverless.mjs';
