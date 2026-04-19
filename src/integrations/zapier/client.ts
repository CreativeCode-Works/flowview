import type { ZapierZapV2, ZapierZapsV2Response } from "./types";

interface ZapierClientConfig {
  accessToken: string;
}

const BASE_URL = "https://api.zapier.com";
const RATE_LIMIT_DELAY_MS = 420; // 150 req/min = 400ms between requests, add buffer

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ZapierClient {
  private accessToken: string;
  private lastRequestAt = 0;

  constructor(config: ZapierClientConfig) {
    this.accessToken = config.accessToken;
  }

  private async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    const now = Date.now();
    const elapsed = now - this.lastRequestAt;
    if (elapsed < RATE_LIMIT_DELAY_MS) {
      await sleep(RATE_LIMIT_DELAY_MS - elapsed);
    }

    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    this.lastRequestAt = Date.now();

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000;
      await sleep(waitMs);
      return this.request<T>(path, params);
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Zapier API error ${response.status}: ${body.slice(0, 500)}`
      );
    }

    return response.json() as Promise<T>;
  }

  async getZaps(): Promise<ZapierZapV2[]> {
    const all: ZapierZapV2[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.request<ZapierZapsV2Response>("/v2/zaps", {
        limit: String(limit),
        offset: String(offset),
      });

      all.push(...response.data);

      if (!response.links.next || response.data.length < limit) break;
      offset += response.data.length;
    }

    return all;
  }

  // Note: Zap run history is NOT publicly available via the Zapier API.
  // last_successful_run_date on the Zap object is the only proxy signal.
  // We surface this limitation as an audit finding.
}
