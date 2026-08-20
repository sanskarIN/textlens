import { getVersion } from "./platform/app";

function initializeAppVersion(): void {
  const label = document.querySelector<HTMLElement>("#aboutDialog .eyebrow");
  if (!label) return;

  label.textContent = "TextLens";
  void getVersion()
    .then((version) => {
      label.textContent = `TextLens ${version}`;
    })
    .catch(() => {
      // Keep the product name as a safe fallback when runtime metadata is unavailable.
    });
}

if (document.readyState === "complete") {
  initializeAppVersion();
} else {
  document.addEventListener("DOMContentLoaded", initializeAppVersion, { once: true });
}
