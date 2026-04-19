import type {
  AcAutomationsResponse,
  AcContactsResponse,
  AcTagsResponse,
  AcDealsResponse,
  AcDealGroupsResponse,
  AcCampaignsResponse,
  AcWebhooksResponse,
  AcListsResponse,
  AcContactAutomationsResponse,
  AcActivitiesResponse,
} from "./types";

interface AcClientConfig {
  baseUrl: string; // e.g. "https://account.api-us1.com"
  apiToken: string;
}

const MAX_PER_PAGE = 100;
const RATE_LIMIT_DELAY_MS = 220; // 5 req/s = 200ms between requests, add buffer

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ActiveCampaignClient {
  private baseUrl: string;
  private apiToken: string;
  private lastRequestAt = 0;

  constructor(config: AcClientConfig) {
    // Strip trailing slash
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiToken = config.apiToken;
  }

  private async request<T>(
    path: string,
    params?: Record<string, string>
  ): Promise<T> {
    // Simple rate limiter: ensure minimum gap between requests
    const now = Date.now();
    const elapsed = now - this.lastRequestAt;
    if (elapsed < RATE_LIMIT_DELAY_MS) {
      await sleep(RATE_LIMIT_DELAY_MS - elapsed);
    }

    const url = new URL(`${this.baseUrl}/api/3${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const response = await fetch(url.toString(), {
      headers: { "Api-Token": this.apiToken },
    });

    this.lastRequestAt = Date.now();

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;
      await sleep(waitMs);
      return this.request<T>(path, params);
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `ActiveCampaign API error ${response.status}: ${body.slice(0, 500)}`
      );
    }

    return response.json() as Promise<T>;
  }

  private async paginate<T>(
    path: string,
    key: string,
    params?: Record<string, string>
  ): Promise<T[]> {
    const all: T[] = [];
    let offset = 0;

    while (true) {
      const response = await this.request<Record<string, unknown>>(path, {
        ...params,
        limit: String(MAX_PER_PAGE),
        offset: String(offset),
      });

      const items = response[key] as T[];
      if (!items || items.length === 0) break;

      all.push(...items);

      const total = parseInt(
        (response.meta as { total: string })?.total ?? "0",
        10
      );
      offset += items.length;
      if (offset >= total) break;
    }

    return all;
  }

  // ---- Config sync endpoints ----

  async getAutomations(): Promise<AcAutomationsResponse["automations"]> {
    return this.paginate("/automations", "automations");
  }

  async getTags(): Promise<AcTagsResponse["tags"]> {
    return this.paginate("/tags", "tags");
  }

  async getLists(): Promise<AcListsResponse["lists"]> {
    return this.paginate("/lists", "lists");
  }

  async getCampaigns(): Promise<AcCampaignsResponse["campaigns"]> {
    return this.paginate("/campaigns", "campaigns");
  }

  async getWebhooks(): Promise<AcWebhooksResponse["webhooks"]> {
    return this.paginate("/webhooks", "webhooks");
  }

  async getDealGroups(): Promise<AcDealGroupsResponse> {
    return this.request<AcDealGroupsResponse>("/dealGroups");
  }

  async getDeals(): Promise<AcDealsResponse["deals"]> {
    return this.paginate("/deals", "deals");
  }

  // ---- Contact sync endpoints ----

  async getContacts(
    params?: Record<string, string>
  ): Promise<AcContactsResponse["contacts"]> {
    return this.paginate("/contacts", "contacts", params);
  }

  async getContactTags(
    contactId: string
  ): Promise<AcContactAutomationsResponse["contactAutomations"]> {
    return this.paginate(
      `/contacts/${contactId}/contactTags`,
      "contactTags"
    );
  }

  async getContactAutomations(
    contactId: string
  ): Promise<AcContactAutomationsResponse["contactAutomations"]> {
    return this.paginate(
      `/contacts/${contactId}/contactAutomations`,
      "contactAutomations"
    );
  }

  async getContactActivities(
    contactId: string,
    after?: string
  ): Promise<AcActivitiesResponse["activities"]> {
    const params: Record<string, string> = { contact: contactId };
    if (after) params.after = after;
    const response = await this.request<AcActivitiesResponse>(
      "/activities",
      params
    );
    return response.activities ?? [];
  }
}
