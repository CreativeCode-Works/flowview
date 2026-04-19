import Nango from "@nangohq/frontend";

let nangoInstance: Nango | null = null;

export function getNango(): Nango {
  if (!nangoInstance) {
    nangoInstance = new Nango({
      publicKey: process.env.NEXT_PUBLIC_NANGO_PUBLIC_KEY!,
    });
  }
  return nangoInstance;
}
