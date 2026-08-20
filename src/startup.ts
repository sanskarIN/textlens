import { en } from "./i18n/en";
import { installStorageFallback } from "./lib/storage";
import "./startup.css";

async function start(): Promise<void> {
  const storageMode = installStorageFallback();

  try {
    await import("./main");
    await import("./platform.css");
    await Promise.all([
      import("./presets-ui"),
      import("./app-version-ui"),
      import("./updates-ui"),
    ]);

    if (storageMode === "memory") {
      const status = document.getElementById("analysisStatus");
      if (status) status.textContent = en.storageSessionOnly;
    }

    void registerWebServiceWorker();
  } catch {
    renderStartupFailure();
  }
}

async function registerWebServiceWorker(): Promise<void> {
  if (import.meta.env.MODE !== "web" || !("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    // PWA installation/offline caching is an enhancement; analysis must still start if registration is blocked.
  }
}

function renderStartupFailure(): void {
  const root = document.getElementById("app");
  if (!root) return;

  root.replaceChildren();
  const main = document.createElement("main");
  main.className = "startup-error";

  const heading = document.createElement("h1");
  heading.textContent = en.startupFailedTitle;
  const body = document.createElement("p");
  body.textContent = en.startupFailedBody;

  main.append(heading, body);
  root.append(main);
}

void start();
