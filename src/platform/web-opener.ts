export async function openUrl(url: string): Promise<void> {
  const parsed = new URL(url, window.location.href);
  if (!new Set(["https:", "http:", "mailto:"]).has(parsed.protocol)) {
    throw new Error(`Blocked unsupported URL protocol: ${parsed.protocol}`);
  }

  const opened = window.open(parsed.href, "_blank", "noopener,noreferrer");
  if (!opened && parsed.protocol !== "mailto:") {
    window.location.assign(parsed.href);
  }
}
