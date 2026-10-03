import OpenAI from "openai";

/**
 * Resolve OpenAI credentials from the environment.
 *
 * Replit's AI Integrations pair is preferred when both halves are present, so
 * running inside the Replit workspace behaves exactly as before. Anywhere else
 * (local dev, Vercel) falls back to a standard OpenAI API key.
 */
function resolveConfig(): { apiKey: string; baseURL?: string } {
  const replitKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const replitBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

  if (replitKey && replitBaseUrl) {
    return { apiKey: replitKey, baseURL: replitBaseUrl };
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    const baseURL = process.env.OPENAI_BASE_URL;
    return baseURL ? { apiKey, baseURL } : { apiKey };
  }

  throw new Error(
    "No OpenAI credentials found. Set OPENAI_API_KEY (and optionally " +
      "OPENAI_BASE_URL), or provision the Replit OpenAI AI integration, which " +
      "supplies AI_INTEGRATIONS_OPENAI_API_KEY and AI_INTEGRATIONS_OPENAI_BASE_URL.",
  );
}

let instance: OpenAI | null = null;

function getClient(): OpenAI {
  if (!instance) {
    instance = new OpenAI(resolveConfig());
  }

  return instance;
}

/**
 * Lazily constructed OpenAI client.
 *
 * Importing this module must never throw: the client is only used by the
 * optional `/api/player/explain` route, and a module-level throw would take
 * the whole API server down at boot when no key is configured. Resolution is
 * therefore deferred to first property access, where the missing-credentials
 * error surfaces inside the route's existing try/catch.
 */
export const openai: OpenAI = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client as object, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
  has(_target, prop) {
    return Reflect.has(getClient() as object, prop);
  },
});

/** True when credentials are configured, without constructing a client. */
export function hasOpenAICredentials(): boolean {
  return Boolean(
    (process.env.AI_INTEGRATIONS_OPENAI_API_KEY &&
      process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) ||
      process.env.OPENAI_API_KEY,
  );
}
