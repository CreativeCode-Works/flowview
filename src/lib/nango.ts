import Nango from "@nangohq/frontend";

export function createNangoClient(connectSessionToken: string): Nango {
  return new Nango({ connectSessionToken });
}
