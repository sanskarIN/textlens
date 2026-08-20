import { en } from "./i18n/en";
import { openUrl } from "./platform/opener";

const RELEASES_URL = "https://github.com/sanskarIN/textlens/releases";

function initializeUpdatesUi(): void {
  const form = document.getElementById("settingsForm");
  const actions = form?.querySelector<HTMLElement>(".actions.end");
  if (!form || !actions || document.getElementById("updatesPanel")) return;

  const section = document.createElement("section");
  section.id = "updatesPanel";
  section.className = "privacy";
  section.setAttribute("aria-labelledby", "updatesHeading");

  const heading = document.createElement("h3");
  heading.id = "updatesHeading";
  heading.textContent = en.updates;

  const body = document.createElement("p");
  body.textContent = en.updatesBody;

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = en.checkReleases;
  button.addEventListener("click", () => {
    void openUrl(RELEASES_URL).catch(() => {
      const status = document.getElementById("analysisStatus");
      if (status) {
        status.textContent = "The Releases page could not be opened.";
        status.classList.add("error");
      }
    });
  });

  section.append(heading, body, button);
  actions.insertAdjacentElement("beforebegin", section);
}

if (document.readyState === "complete") {
  initializeUpdatesUi();
} else {
  document.addEventListener("DOMContentLoaded", initializeUpdatesUi, { once: true });
}
