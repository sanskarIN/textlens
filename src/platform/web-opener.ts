interface GlobalOpenerApi {
  openUrl(url: string): Promise<void>;
}

export async function openUrl(url: string): Promise<void> {
  const parsed = new URL(url, window.location.href);
  if (!new Set(["https:", "http:", "mailto:"]).has(parsed.protocol)) {
    throw new Error(`Blocked unsupported URL protocol: ${parsed.protocol}`);
  }

  if (import.meta.env.MODE === "mobile") {
    await mobileOpener().openUrl(parsed.href);
    return;
  }

  const opened = window.open(parsed.href, "_blank", "noopener,noreferrer");
  if (!opened && parsed.protocol !== "mailto:") {
    window.location.assign(parsed.href);
  }
}

function mobileOpener(): GlobalOpenerApi {
  const tauriWindow = window as Window & {
    __TAURI__?: { opener?: GlobalOpenerApi };
  };
  const opener = tauriWindow.__TAURI__?.opener;
  if (!opener) {
    throw new Error("The native mobile URL opener is unavailable.");
  }
  return opener;
}
