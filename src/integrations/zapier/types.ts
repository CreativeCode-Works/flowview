// Zapier API response types
// Using v2 (Powered by Zapier) as primary, v1 as fallback
// Note: v1 IDs are integers, v2 IDs are UUIDs

export interface ZapierZapStep {
  action: string; // dotted format: "app_slug.trigger_key"
  authentication: string | null;
  inputs: Record<string, unknown> | null;
  title: string;
  // v1-only fields
  type_of?: "read" | "write"; // trigger vs action
  app?: ZapierApp;
  params?: Record<string, string> | null;
}

export interface ZapierApp {
  id: number;
  slug: string;
  title: string;
  description: string;
  hex_color: string;
  image: string;
  images: {
    url_16x16: string;
    url_32x32: string;
    url_64x64: string;
    url_128x128: string;
  };
  api: string;
  url: string;
}

// v2 response shape (preferred)
export interface ZapierZapV2 {
  type: "zap";
  id: string; // UUID
  is_enabled: boolean;
  last_successful_run_date: string | null; // ISO 8601
  updated_at: string; // ISO 8601
  title: string;
  links: {
    html_editor: string;
  };
  steps: ZapierZapStep[];
}

export interface ZapierZapsV2Response {
  links: {
    next: string | null;
    prev: string | null;
  };
  meta: {
    count: number;
    offset: number;
    limit: number;
  };
  data: ZapierZapV2[];
}

// v1 response shape (fallback)
export interface ZapierZapV1 {
  id: number;
  modified_at: string; // ISO 8601
  state: "on" | "off";
  steps: ZapierZapStep[];
}

export interface ZapierZapsV1Response {
  next: string | null;
  previous: string | null;
  count: number;
  objects: ZapierZapV1[];
}
