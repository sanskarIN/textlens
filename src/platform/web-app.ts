import packageMetadata from "../../package.json";

interface GlobalAppApi {
  getVersion(): Promise<string>;
}

export async function getVersion(): Promise<string> {
  if (import.meta.env.MODE === "mobile") {
    const tauriWindow = window as Window & {
      __TAURI__?: { app?: GlobalAppApi };
    };
    const app = tauriWindow.__TAURI__?.app;
    if (app) return app.getVersion();
  }
  return packageMetadata.version;
}
