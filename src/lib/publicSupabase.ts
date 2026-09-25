const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const PUBLIC_REQUEST_TIMEOUT_MS = 6_500;

export function isPublicSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Performs a short, unauthenticated request to the public Supabase REST API.
 * Public pages must never wait indefinitely for a remote catalog or settings request.
 */
export async function publicSupabaseFetch(
  path: string,
  init: RequestInit = {},
  timeoutMs = PUBLIC_REQUEST_TIMEOUT_MS,
): Promise<Response> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Public Supabase configuration is missing.');
  }

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(`${supabaseUrl}/rest/v1${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        ...init.headers,
      },
    });
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}
