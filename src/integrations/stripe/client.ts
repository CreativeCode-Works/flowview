import type {
  StripeList,
  StripeProduct,
  StripePrice,
  StripeCustomer,
  StripeSubscription,
  StripeCharge,
  StripeInvoice,
  StripeWebhookEndpoint,
  StripeEvent,
} from "./types";

interface StripeClientConfig {
  secretKey: string;
}

const BASE_URL = "https://api.stripe.com/v1";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class StripeClient {
  private secretKey: string;

  constructor(config: StripeClientConfig) {
    this.secretKey = config.secretKey;
  }

  private async request<T>(
    path: string,
    params?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
      },
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;
      await sleep(waitMs);
      return this.request<T>(path, params);
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Stripe API error ${response.status}: ${body.slice(0, 500)}`
      );
    }

    return response.json() as Promise<T>;
  }

  private async paginate<T extends { id: string }>(
    path: string,
    params?: Record<string, string>
  ): Promise<T[]> {
    const all: T[] = [];
    let startingAfter: string | undefined;

    while (true) {
      const queryParams: Record<string, string> = {
        ...params,
        limit: "100",
      };
      if (startingAfter) {
        queryParams.starting_after = startingAfter;
      }

      const response = await this.request<StripeList<T>>(path, queryParams);
      all.push(...response.data);

      if (!response.has_more) break;
      startingAfter = response.data[response.data.length - 1].id;
    }

    return all;
  }

  // ---- Config sync endpoints ----

  async getProducts(): Promise<StripeProduct[]> {
    return this.paginate<StripeProduct>("/products", { active: "true" });
  }

  async getPrices(productId?: string): Promise<StripePrice[]> {
    const params: Record<string, string> = { active: "true" };
    if (productId) params.product = productId;
    return this.paginate<StripePrice>("/prices", params);
  }

  async getWebhookEndpoints(): Promise<StripeWebhookEndpoint[]> {
    return this.paginate<StripeWebhookEndpoint>("/webhook_endpoints");
  }

  // ---- Contact/event sync endpoints ----

  async getCustomers(): Promise<StripeCustomer[]> {
    return this.paginate<StripeCustomer>("/customers");
  }

  async getSubscriptions(
    status?: string
  ): Promise<StripeSubscription[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    else params.status = "all";
    return this.paginate<StripeSubscription>("/subscriptions", params);
  }

  async getCharges(since?: number): Promise<StripeCharge[]> {
    const params: Record<string, string> = {};
    if (since) params["created[gte]"] = String(since);
    return this.paginate<StripeCharge>("/charges", params);
  }

  async getInvoices(since?: number): Promise<StripeInvoice[]> {
    const params: Record<string, string> = {};
    if (since) params["created[gte]"] = String(since);
    return this.paginate<StripeInvoice>("/invoices", params);
  }

  // Events only go back 30 days on Stripe's API
  async getEvents(since?: number): Promise<StripeEvent[]> {
    const params: Record<string, string> = {};
    if (since) params["created[gte]"] = String(since);
    return this.paginate<StripeEvent>("/events", params);
  }
}
