import type { Platform } from "@/types/unified";

export interface IntegrationConfig {
  platform: Platform;
  displayName: string;
  description: string;
  icon: string; // path or component name
  authType: "api_key" | "oauth";
  nangoIntegrationId: string | null; // null if not using Nango
}

export const integrations: Record<Platform, IntegrationConfig> = {
  activecampaign: {
    platform: "activecampaign",
    displayName: "ActiveCampaign",
    description: "Marketing automation, email campaigns, CRM, and deal pipelines",
    icon: "activecampaign",
    authType: "api_key", // AC uses API key, not OAuth
    nangoIntegrationId: "active-campaign",
  },
  zapier: {
    platform: "zapier",
    displayName: "Zapier",
    description: "Workflow automation connecting your apps",
    icon: "zapier",
    authType: "oauth",
    nangoIntegrationId: null, // Zapier requires Partner API — deferred
  },
  stripe: {
    platform: "stripe",
    displayName: "Stripe",
    description: "Payments, subscriptions, and billing",
    icon: "stripe",
    authType: "api_key",
    nangoIntegrationId: "stripe-api-key",
  },
};

export function getIntegration(platform: Platform): IntegrationConfig {
  return integrations[platform];
}

export function getAllPlatforms(): Platform[] {
  return Object.keys(integrations) as Platform[];
}
