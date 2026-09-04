/**
 * AnySearch Web Search integration.
 *
 * POST https://api.anysearch.com/v1/search
 * The API key is optional: anonymous traffic (no Authorization header) is
 * rate-limited per client IP and metered against a daily free quota. An
 * invalid/expired key returns 401/403 — the gateway never silently falls
 * back to anonymous mode, so the header is only sent when a key exists.
 */

import { proxyFetch } from '@/lib/server/proxy-fetch';
import type { WebSearchResult, WebSearchSource } from '@/lib/types/web-search';

const ANYSEARCH_DEFAULT_BASE_URL = 'https://api.anysearch.com';

function buildAnySearchUrl(baseUrl?: string): string {
  const trimmed = (baseUrl || ANYSEARCH_DEFAULT_BASE_URL).replace(/\/$/, '');
  if (trimmed.endsWith('/v1/search')) return trimmed;
  if (trimmed.endsWith('/v1')) return `${trimmed}/search`;
  return `${trimmed}/v1/search`;
}

function formatAnySearchError(status: number, statusText: string, errorText: string): string {
  if (!errorText) return `AnySearch API error (${status}): ${statusText}`;

  try {
    const parsed = JSON.parse(errorText) as { code?: string | number; message?: string };
    const code = parsed.code ?? status;
    const message = parsed.message || statusText;
    return `AnySearch API error (${code}): ${message}`;
  } catch {
    return `AnySearch API error (${status}): ${errorText}`;
  }
}

/**
 * Search the web using the AnySearch unified search API.
 * Works anonymously (free tier) when no apiKey is supplied.
 */
export async function searchWithAnySearch(params: {
  query: string;
  apiKey?: string;
  maxResults?: number;
  baseUrl?: string;
  signal?: AbortSignal;
}): Promise<WebSearchResult> {
  const { query, apiKey, maxResults = 10, baseUrl, signal } = params;
  const startedAt = Date.now();

  const res = await proxyFetch(buildAnySearchUrl(baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ query, max_results: Math.max(Math.floor(maxResults), 1) }),
    ...(signal ? { signal } : {}),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(formatAnySearchError(res.status, res.statusText, errorText));
  }

  const raw = (await res.json()) as AnySearchResponse;
  if (raw.code !== 0) {
    throw new Error(`AnySearch API error (${raw.code ?? 'unknown'}): ${raw.message || 'Request failed'}`);
  }

  const sources: WebSearchSource[] = (raw.data?.results || [])
    .map((item) => {
      const url = item.url || '';
      return {
        title: item.title || url,
        url,
        content: item.snippet || item.content || '',
        score: 0,
      };
    })
    .filter((source) => source.url);

  return {
    answer: '',
    sources,
    query,
    responseTime: (Date.now() - startedAt) / 1000,
  };
}

interface AnySearchResponse {
  code?: number;
  message?: string;
  data?: {
    results?: AnySearchResultItem[];
    metadata?: {
      request_id?: string;
      total_results?: number;
      search_time_ms?: number;
    };
  };
}

interface AnySearchResultItem {
  title?: string;
  url?: string;
  snippet?: string;
  content?: string;
}
