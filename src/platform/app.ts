import { getVersion as getPortableVersion } from "./web-app";

export async function getVersion(): Promise<string> {
  if (import.meta.env.MODE === "web") {
    return getPortableVersion();
  }

  const { getVersion: getNativeVersion } = await import("@tauri-apps/api/app");
  return getNativeVersion();
}
