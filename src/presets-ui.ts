import { en } from "./i18n/en";
import {
  createAnalysisPreset,
  loadAnalysisPresets,
  removeAnalysisPreset,
  saveAnalysisPresets,
  upsertAnalysisPreset,
} from "./lib/presets";
import type { AnalysisOptions, AnalysisPreset } from "./types";
import "./presets.css";

let presets: AnalysisPreset[] = loadAnalysisPresets();

function get<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element as T;
}

function setStatus(message: string, error = false): void {
  const status = document.getElementById("analysisStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", error);
}

function readDraftAnalysisOptions(): AnalysisOptions {
  return {
    readingWpm: Number(get<HTMLInputElement>("readingWpmInput").value),
    speakingWpm: Number(get<HTMLInputElement>("speakingWpmInput").value),
    topKeywords: Number(get<HTMLInputElement>("topKeywordsInput").value),
    topNgrams: Number(get<HTMLInputElement>("topNgramsInput").value),
    keywordExclusions: get<HTMLTextAreaElement>("keywordExclusionsInput")
      .value.split(/[\n,]+/)
      .map((value) => value.trim()),
  };
}

function writePresetToDraft(preset: AnalysisPreset): void {
  get<HTMLInputElement>("readingWpmInput").value = String(preset.readingWpm);
  get<HTMLInputElement>("speakingWpmInput").value = String(preset.speakingWpm);
  get<HTMLInputElement>("topKeywordsInput").value = String(preset.topKeywords);
  get<HTMLInputElement>("topNgramsInput").value = String(preset.topNgrams);
  get<HTMLTextAreaElement>("keywordExclusionsInput").value = preset.keywordExclusions.join(", ");
}

function renderPresetList(list: HTMLElement): void {
  list.replaceChildren();
  if (!presets.length) {
    list.className = "preset-list empty";
    list.textContent = en.noPresets;
    return;
  }

  list.className = "preset-list";
  presets.forEach((preset, index) => {
    const row = document.createElement("div");
    row.className = "preset-row";
    row.setAttribute("role", "listitem");

    const details = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = preset.name;
    const summary = document.createElement("span");
    summary.textContent = `${preset.readingWpm} / ${preset.speakingWpm} words/min · ${preset.topKeywords} keywords · ${preset.topNgrams} n-grams`;
    details.append(name, summary);

    const actions = document.createElement("div");
    actions.className = "preset-actions";

    const apply = document.createElement("button");
    apply.type = "button";
    apply.dataset.presetApply = String(index);
    apply.textContent = en.applyPreset;
    apply.setAttribute("aria-label", `${en.applyPreset}: ${preset.name}`);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.dataset.presetDelete = String(index);
    remove.textContent = en.deletePreset;
    remove.setAttribute("aria-label", `${en.deletePreset}: ${preset.name}`);

    actions.append(apply, remove);
    row.append(details, actions);
    list.append(row);
  });
}

function initializePresetUi(): void {
  const form = document.getElementById("settingsForm") as HTMLFormElement | null;
  const settingsGrid = form?.querySelector<HTMLElement>(".settings");
  if (!form || !settingsGrid || document.getElementById("analysisPresetsPanel")) return;

  const section = document.createElement("section");
  section.id = "analysisPresetsPanel";
  section.className = "preset-panel";
  section.setAttribute("aria-labelledby", "analysisPresetsHeading");
  section.innerHTML = `
    <h3 id="analysisPresetsHeading">${en.analysisPresets}</h3>
    <p id="analysisPresetsHint">${en.analysisPresetsHint}</p>
    <div class="preset-create">
      <label for="presetNameInput">${en.presetName}</label>
      <div>
        <input id="presetNameInput" type="text" maxlength="48" autocomplete="off" placeholder="${en.presetNamePlaceholder}" aria-describedby="analysisPresetsHint">
        <button id="savePresetButton" type="button">${en.savePreset}</button>
      </div>
    </div>
    <div id="presetList" class="preset-list" role="list" aria-live="polite"></div>`;
  settingsGrid.insertAdjacentElement("afterend", section);

  const nameInput = get<HTMLInputElement>("presetNameInput");
  const list = get<HTMLElement>("presetList");
  renderPresetList(list);

  nameInput.addEventListener("input", () => nameInput.setCustomValidity(""));

  get<HTMLButtonElement>("savePresetButton").addEventListener("click", () => {
    const created = createAnalysisPreset(nameInput.value, readDraftAnalysisOptions());
    if (!created) {
      nameInput.setCustomValidity(en.presetNameRequired);
      nameInput.reportValidity();
      return;
    }

    const next = upsertAnalysisPreset(presets, created);
    if (!saveAnalysisPresets(next)) {
      setStatus(en.presetStorageError, true);
      return;
    }

    presets = next;
    nameInput.value = "";
    renderPresetList(list);
    setStatus(en.presetSaved);
  });

  list.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>(
      "[data-preset-apply], [data-preset-delete]",
    );
    if (!button) return;

    const applyIndex = button.dataset.presetApply;
    if (applyIndex !== undefined) {
      const index = Number(applyIndex);
      const selected = presets[index];
      if (!selected) return;
      writePresetToDraft(selected);
      setStatus(en.presetApplied);
      form.requestSubmit();
      return;
    }

    const deleteIndex = Number(button.dataset.presetDelete);
    const next = removeAnalysisPreset(presets, deleteIndex);
    if (next.length === presets.length || !saveAnalysisPresets(next)) {
      if (next.length !== presets.length) setStatus(en.presetStorageError, true);
      return;
    }
    presets = next;
    renderPresetList(list);
    setStatus(en.presetDeleted);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePresetUi, { once: true });
} else {
  initializePresetUi();
}
