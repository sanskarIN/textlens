import { installStorageFallback } from "./lib/storage";

async function start(): Promise<void> {
  const storageMode = installStorageFallback();

  try {
    await import("./main");
    await Promise.all([import("./presets-ui"), import("./app-version-ui")]);

    if (storageMode === "memory") {
      const status = document.getElementById("analysisStatus");
      if (status) {
        status.textContent =
          "Local preference storage is unavailable. Text analysis still works, but preferences are session-only.";
      }
    }
  } catch {
    renderStartupFailure();
  }
}

function renderStartupFailure(): void {
  const root = document.getElementById("app");
  if (!root) return;

  root.replaceChildren();
  const main = document.createElement("main");
  main.className = "startup-error";

  const heading = document.createElement("h1");
  heading.textContent = "TextLens could not start";
  const body = document.createElement("p");
  body.textContent =
    "The application hit a local startup error. Restart TextLens; if the problem continues, use the support details in the project documentation.";

  main.append(heading, body);
  root.append(main);
}

void start();
