import { openUrl as openPortableUrl } from "./web-opener";

export async function openUrl(url: string): Promise<void> {
  if (import.meta.env.MODE === "web") {
    return openPortableUrl(url);
  }

  const { openUrl: openNativeUrl } = await import("@tauri-apps/plugin-opener");
  await openNativeUrl(url);
}
