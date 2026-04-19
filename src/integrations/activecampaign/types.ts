// ActiveCampaign API v3 response types
// NOTE: AC returns nearly everything as strings, even numbers and booleans.
// We type them as strings here and coerce in normalize.ts.

export interface AcAutomation {
  id: string;
  name: string;
  cdate: string;
  mdate: string;
  status: string; // "1" = active, "0" = inactive
  entered: string;
  exited: string;
  hidden: string;
  links: {
    campaigns?: string;
    contactGoals?: string;
    contactAutomations?: string;
    blocks?: string;
  };
}

export interface AcContact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  orgid: string;
  orgname: string;
  cdate: string;
  udate: string;
  adate: string;
  deleted: string;
  bounced_hard: string;
  bounced_soft: string;
  score: string;
  links: Record<string, string>;
}

export interface AcContactTag {
  id: string;
  cdate: string;
  contact: string;
  tag: string; // tag ID, not name
  links: Record<string, string>;
}

export interface AcTag {
  id: string;
  tag: string; // the tag name
  tagType: string;
  description: string;
  cdate: string;
  subscriber_count: string;
}

export interface AcContactAutomation {
  id: string;
  contact: string;
  seriesid: string; // automation ID
  startid: string;
  status: string; // "1" = active, "2" = complete, "0" = removed
  adddate: string;
  remdate: string | null;
  lastdate: string;
  completedElements: string;
  totalElements: string;
  completed: string;
  links: Record<string, string>;
}

export interface AcDeal {
  id: string;
  title: string;
  value: string; // in cents, as string
  currency: string;
  status: string; // "0" = open, "1" = won, "2" = lost
  stage: string; // dealStage ID
  group: string; // pipeline (dealGroup) ID
  owner: string;
  contact: string;
  description: string;
  cdate: string;
  mdate: string;
  links: Record<string, string>;
}

export interface AcDealGroup {
  id: string;
  title: string;
  currency: string;
  cdate: string;
  udate: string;
  stages: string[];
  links: Record<string, string>;
}

export interface AcDealStage {
  id: string;
  title: string;
  group: string; // pipeline ID
  order: string;
  color: string;
  cdate: string;
  udate: string;
}

export interface AcCampaign {
  id: string;
  name: string;
  type: string;
  status: string; // "0"-"7", see CLAUDE.md
  sdate: string;
  ldate: string;
  cdate: string;
  send_amt: string;
  opens: string;
  uniqueopens: string;
  linkclicks: string;
  hardbounces: string;
  softbounces: string;
  unsubscribes: string;
  seriesid: string; // automation ID if campaign-in-automation
  links: Record<string, string>;
}

export interface AcWebhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  sources: string[];
  listid: string;
  cdate: string;
  links: Record<string, string>;
}

export interface AcList {
  id: string;
  name: string;
  stringid: string;
  cdate: string;
  subscriber_count: string;
  links: Record<string, string>;
}

export interface AcActivity {
  tstamp: string;
  type: string;
  text: string;
  contact: string;
  links: Record<string, string>;
}

// API response wrappers

export interface AcPaginatedMeta {
  total: string;
}

export interface AcListResponse<K extends string, T> {
  [key: string]: T[] | AcPaginatedMeta;
  meta: AcPaginatedMeta;
}

export interface AcAutomationsResponse {
  automations: AcAutomation[];
  meta: AcPaginatedMeta;
}

export interface AcContactsResponse {
  contacts: AcContact[];
  meta: AcPaginatedMeta;
}

export interface AcTagsResponse {
  tags: AcTag[];
  meta: AcPaginatedMeta;
}

export interface AcDealsResponse {
  deals: AcDeal[];
  meta: AcPaginatedMeta;
}

export interface AcDealGroupsResponse {
  dealGroups: AcDealGroup[];
  dealStages: AcDealStage[];
  meta: AcPaginatedMeta;
}

export interface AcCampaignsResponse {
  campaigns: AcCampaign[];
  meta: AcPaginatedMeta;
}

export interface AcWebhooksResponse {
  webhooks: AcWebhook[];
  meta: AcPaginatedMeta;
}

export interface AcListsResponse {
  lists: AcList[];
  meta: AcPaginatedMeta;
}

export interface AcContactAutomationsResponse {
  contactAutomations: AcContactAutomation[];
  meta: AcPaginatedMeta;
}

export interface AcActivitiesResponse {
  activities: AcActivity[];
}
