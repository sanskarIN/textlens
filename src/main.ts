import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { en } from "./i18n/en";
import { comparisonMetrics, keywordDeltas, type ComparisonUnit } from "./lib/comparison";
import { formatBytes, formatDuration, formatInteger } from "./lib/format";
import { encodingSummary, escapeHtml, metricRows } from "./lib/presentation";
import { filterQuickActions, type SearchableAction } from "./lib/quickActions";
import { defaultSettings, loadSettings, parseSettings, saveSettings } from "./state";
import type {
  AnalysisOptions,
  AnalysisReport,
  AppSettings,
  FrequencyItem,
  ThemePreference,
} from "./types";
import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("TextLens root element was not found.");

app.innerHTML = `
<div class="app-shell">
  <header class="topbar">
    <a class="brand" href="#workspace" aria-label="TextLens home">
      <img src="/logo.svg" alt="" width="36" height="36">
      <span><strong>${en.appName}</strong><small>${en.tagline}</small></span>
    </a>
    <nav aria-label="Application">
      <button id="quickActionsButton" class="ghost" type="button" aria-keyshortcuts="Control+Shift+P Meta+Shift+P">${en.quickActions}</button>
      <button id="settingsButton" class="ghost" type="button">${en.settings}</button>
      <button id="aboutButton" class="ghost" type="button">${en.about}</button>
    </nav>
  </header>
  <main id="workspace" class="workspace">
    <section id="onboarding" class="onboarding" aria-labelledby="welcomeTitle">
      <div>
        <p class="eyebrow">${en.welcomeEyebrow}</p>
        <h1 id="welcomeTitle">${en.welcomeTitle}</h1>
        <p>${en.welcomeBody}</p>
      </div>
      <button id="dismissOnboarding" class="ghost" type="button">${en.gotIt}</button>
    </section>

    <section class="panel editor-panel" aria-labelledby="inputHeading">
      <div class="heading">
        <div><p class="eyebrow">${en.workspace}</p><h2 id="inputHeading">${en.inputLabel}</h2></div>
        <div class="actions">
          <button id="openButton" class="primary" type="button">${en.openFile}</button>
          <button id="clearButton" type="button">${en.clear}</button>
        </div>
      </div>
      <label class="sr-only" for="textInput">${en.inputLabel}</label>
      <textarea id="textInput" spellcheck="true" autocomplete="off" placeholder="${en.inputPlaceholder}" aria-describedby="privacyHint analysisStatus"></textarea>
      <div class="editor-footer">
        <p id="privacyHint">${en.privacyNote}</p>
        <p id="analysisStatus" role="status" aria-live="polite">${en.ready}</p>
      </div>
    </section>

    <section aria-labelledby="overviewHeading">
      <div class="heading compact">
        <div><p class="eyebrow">${en.overview}</p><h2 id="overviewHeading">${en.liveMetrics}</h2></div>
        <span id="sourceBadge" class="badge">${en.pastedText}</span>
      </div>
      <div id="metricsGrid" class="metrics" aria-live="polite"></div>
    </section>

    <div class="columns">
      <section class="panel">
        <div class="heading compact"><div><p class="eyebrow">${en.language}</p><h2>${en.keywords}</h2></div></div>
        <div id="keywordsList" class="frequency empty">${en.nothingToShow}</div>
      </section>
      <section class="panel">
        <div class="heading compact">
          <div><p class="eyebrow">${en.patterns}</p><h2>${en.ngrams}</h2></div>
          <div class="segmented" role="group" aria-label="N-gram size">
            <button class="active" data-ngram="2" type="button">${en.twoWord}</button>
            <button data-ngram="3" type="button">${en.threeWord}</button>
          </div>
        </div>
        <div id="ngramsList" class="frequency empty">${en.nothingToShow}</div>
      </section>
    </div>

    <section class="panel">
      <div class="heading compact"><div><p class="eyebrow">${en.quality}</p><h2>${en.whitespaceAndLineEndings}</h2></div></div>
      <div id="diagnosticsGrid" class="diagnostics"></div>
    </section>

    <section class="panel export">
      <div>
        <p class="eyebrow">${en.portableResults}</p>
        <h2>${en.exportHeading}</h2>
        <p>${en.exportBody}</p>
      </div>
      <div class="actions">
        <button id="compareReportButton" type="button" disabled>${en.compareReport}</button>
        <button id="exportJsonButton" type="button" disabled>${en.exportJson}</button>
        <button id="exportMarkdownButton" type="button" disabled>${en.exportMarkdown}</button>
      </div>
    </section>
  </main>
  <footer>
    <span>${en.watermark}</span><span>•</span>
    <button class="link" data-external="https://github.com/sanskarIN/textlens" type="button">GitHub</button><span>•</span>
    <button class="link" data-external="https://buymeacoffee.com/sanskarIN" type="button">${en.buyMeACoffee}</button>
  </footer>
</div>

<dialog id="settingsDialog">
  <form id="settingsForm" method="dialog">
    <div class="heading">
      <div><p class="eyebrow">${en.preferences}</p><h2>${en.settings}</h2></div>
      <button value="cancel" class="ghost" aria-label="${en.closeSettings}">${en.close}</button>
    </div>
    <div class="settings">
      <label>${en.theme}
        <select id="themeSelect">
          <option value="system">${en.themeSystem}</option><option value="light">${en.themeLight}</option><option value="dark">${en.themeDark}</option>
        </select>
      </label>
      <label>${en.readingSpeed}<input id="readingWpmInput" type="number" min="30" max="1000"></label>
      <label>${en.speakingSpeed}<input id="speakingWpmInput" type="number" min="30" max="1000"></label>
      <label>${en.topKeywords}<input id="topKeywordsInput" type="number" min="1" max="50"></label>
      <label>${en.topNgrams}<input id="topNgramsInput" type="number" min="1" max="50"></label>
      <label class="check"><input id="reducedMotionInput" type="checkbox">${en.reduceMotion}</label>
      <label class="settings-wide">${en.keywordExclusions}
        <textarea id="keywordExclusionsInput" rows="3" maxlength="6600" placeholder="${en.keywordExclusionsPlaceholder}" aria-describedby="keywordExclusionsHint"></textarea>
        <small id="keywordExclusionsHint">${en.keywordExclusionsHint}</small>
      </label>
    </div>
    <div class="privacy">
      <h3>${en.privacyAndData}</h3>
      <p>${en.privacySettingsBody}</p>
      <div class="actions">
        <button id="backupSettingsButton" type="button">${en.backupSettings}</button>
        <button id="restoreSettingsButton" type="button">${en.restoreSettings}</button>
      </div>
    </div>
    <div class="actions end">
      <button id="resetSettingsButton" type="button">${en.restoreDefaults}</button>
      <button id="saveSettingsButton" class="primary" type="submit">${en.saveSettings}</button>
    </div>
  </form>
</dialog>

<dialog id="aboutDialog">
  <div>
    <div class="heading">
      <div><p class="eyebrow">TextLens 0.1.0</p><h2>${en.about}</h2></div>
      <button id="closeAboutButton" class="ghost" type="button">${en.close}</button>
    </div>
    <img class="about-logo" src="/logo.svg" alt="TextLens logo" width="76" height="76">
    <p>${en.aboutDescription}</p>
    <dl>
      <div><dt>${en.license}</dt><dd>MIT</dd></div>
      <div><dt>${en.business}</dt><dd>sanskarin@outlook.in</dd></div>
      <div><dt>${en.business}</dt><dd>sanskarin.business@gmail.com</dd></div>
      <div><dt>${en.support}</dt><dd>supportramsandesh@gmail.com</dd></div>
    </dl>
    <div class="actions">
      <button data-external="https://github.com/sanskarIN/textlens" type="button">${en.viewSource}</button>
      <button class="primary" data-external="https://buymeacoffee.com/sanskarIN" type="button">${en.buyMeACoffee}</button>
    </div>
    <p class="credit">${en.watermark}</p>
  </div>
</dialog>

<dialog id="compareDialog" class="wide-dialog">
  <div>
    <div class="heading">
      <div><p class="eyebrow">${en.compareEyebrow}</p><h2>${en.compareHeading}</h2></div>
      <button id="closeCompareButton" class="ghost" type="button">${en.close}</button>
    </div>
    <p class="dialog-copy">${en.compareBody}</p>
    <div id="comparisonMeta" class="compare-meta"></div>
    <div class="compare-scroll">
      <table class="compare-table">
        <thead><tr><th>Metric</th><th>${en.compareCurrent}</th><th>${en.compareBaseline}</th><th>${en.compareDifference}</th></tr></thead>
        <tbody id="comparisonMetricsBody"></tbody>
      </table>
    </div>
    <h3>${en.compareKeywords}</h3>
    <div id="comparisonKeywords" class="compare-keywords"></div>
  </div>
</dialog>

<dialog id="quickActionsDialog" class="palette-dialog">
  <div>
    <div class="heading">
      <div><p class="eyebrow">${en.quickActionsEyebrow}</p><h2>${en.quickActionsHeading}</h2></div>
      <button id="closeQuickActionsButton" class="ghost" type="button">${en.close}</button>
    </div>
    <label class="sr-only" for="quickActionsSearch">${en.quickActionsSearch}</label>
    <input id="quickActionsSearch" class="palette-search" type="search" autocomplete="off" spellcheck="false" placeholder="${en.quickActionsPlaceholder}">
    <div id="quickActionsList" class="palette-list"></div>
  </div>
</dialog>`;

function get<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element as T;
}

const input = get<HTMLTextAreaElement>("textInput");
const status = get<HTMLElement>("analysisStatus");
const metrics = get<HTMLElement>("metricsGrid");
const keywords = get<HTMLElement>("keywordsList");
const ngrams = get<HTMLElement>("ngramsList");
const diagnostics = get<HTMLElement>("diagnosticsGrid");
const badge = get<HTMLElement>("sourceBadge");
const exportJson = get<HTMLButtonElement>("exportJsonButton");
const exportMd = get<HTMLButtonElement>("exportMarkdownButton");
const compareButton = get<HTMLButtonElement>("compareReportButton");
const settingsDialog = get<HTMLDialogElement>("settingsDialog");
const aboutDialog = get<HTMLDialogElement>("aboutDialog");
const compareDialog = get<HTMLDialogElement>("compareDialog");
const quickActionsDialog = get<HTMLDialogElement>("quickActionsDialog");
const quickActionsSearch = get<HTMLInputElement>("quickActionsSearch");
const quickActionsList = get<HTMLElement>("quickActionsList");
const comparisonMeta = get<HTMLElement>("comparisonMeta");
const comparisonMetricsBody = get<HTMLTableSectionElement>("comparisonMetricsBody");
const comparisonKeywords = get<HTMLElement>("comparisonKeywords");

let settings = loadSettings();
let report: AnalysisReport | null = null;
let ngram: 2 | 3 = 2;
let timer: number | undefined;
let sequence = 0;

type QuickActionId =
  | "focus-editor"
  | "open-file"
  | "clear"
  | "export-json"
  | "export-markdown"
  | "compare"
  | "settings"
  | "about";

interface QuickActionDefinition extends SearchableAction {
  id: QuickActionId;
  requiresReport: boolean;
}

const quickActions: QuickActionDefinition[] = [
  { id: "focus-editor", label: en.actionFocusEditor, keywords: ["type", "paste", "text"], requiresReport: false },
  { id: "open-file", label: en.actionOpenFile, keywords: ["document", "local", "import"], requiresReport: false },
  { id: "clear", label: en.actionClear, keywords: ["reset", "empty", "editor"], requiresReport: false },
  { id: "export-json", label: en.actionExportJson, keywords: ["save", "report", "json"], requiresReport: true },
  { id: "export-markdown", label: en.actionExportMarkdown, keywords: ["save", "report", "markdown", "md"], requiresReport: true },
  { id: "compare", label: en.actionCompare, keywords: ["diff", "baseline", "report"], requiresReport: true },
  { id: "settings", label: en.actionSettings, keywords: ["preferences", "theme", "keywords"], requiresReport: false },
  { id: "about", label: en.actionAbout, keywords: ["license", "support", "version"], requiresReport: false },
];

const opts = (): AnalysisOptions => ({
  readingWpm: settings.readingWpm,
  speakingWpm: settings.speakingWpm,
  topKeywords: settings.topKeywords,
  topNgrams: settings.topNgrams,
  keywordExclusions: settings.keywordExclusions,
});

function setStatus(message: string, error = false): void {
  status.textContent = message;
  status.classList.toggle("error", error);
}

function setExport(): void {
  const disabled = !report;
  exportJson.disabled = disabled;
  exportMd.disabled = disabled;
  compareButton.disabled = disabled;
}

function renderMetrics(current: AnalysisReport | null): void {
  metrics.innerHTML = metricRows(current)
    .map(
      ([key, value]) =>
        `<article><span>${escapeHtml(key)}</span><strong>${escapeHtml(value)}</strong></article>`,
    )
    .join("");
}

function renderFrequency(element: HTMLElement, items: FrequencyItem[]): void {
  if (!items.length) {
    element.className = "frequency empty";
    element.textContent = en.nothingToShow;
    return;
  }
  element.className = "frequency";
  element.innerHTML = items
    .map(
      (item, index) =>
        `<div class="freq"><span class="rank">${index + 1}</span><div><p><strong>${escapeHtml(item.text)}</strong><span>${formatInteger(item.count)} · ${item.percentage.toFixed(1)}%</span></p><div class="bar"><i style="width:${Math.max(3, Math.min(100, item.percentage))}%"></i></div></div></div>`,
    )
    .join("");
}

function renderDiagnostics(current: AnalysisReport | null): void {
  if (!current) {
    diagnostics.innerHTML = [en.lineEndings, en.blankLines, en.trailingWhitespace, en.encoding]
      .map((label) => `<div><span>${label}</span><strong>—</strong></div>`)
      .join("");
    return;
  }
  const endings = current.whitespace.lineEndings;
  diagnostics.innerHTML = `
    <div><span>${en.lineEndings}</span><strong>${escapeHtml(endings.dominant)}${endings.mixed ? ` · ${en.mixedSuffix}` : ""}</strong></div>
    <div><span>${en.blankLines}</span><strong>${formatInteger(current.whitespace.blankLines)}</strong></div>
    <div><span>${en.trailingWhitespaceLines}</span><strong>${formatInteger(current.whitespace.trailingWhitespaceLines)}</strong></div>
    <div><span>${en.encoding}</span><strong>${escapeHtml(encodingSummary(current))}</strong></div>
    <div><span>${en.spaces}</span><strong>${formatInteger(current.whitespace.spaces)}</strong></div>
    <div><span>${en.tabs}</span><strong>${formatInteger(current.whitespace.tabs)}</strong></div>
    <div><span>LF / CRLF / CR</span><strong>${endings.lf} / ${endings.crlf} / ${endings.cr}</strong></div>
    <div><span>${en.graphemes}</span><strong>${formatInteger(current.stats.graphemes)}</strong></div>`;
}

function render(current: AnalysisReport | null): void {
  renderMetrics(current);
  renderFrequency(keywords, current?.keywords ?? []);
  renderFrequency(ngrams, current ? (ngram === 2 ? current.bigrams : current.trigrams) : []);
  renderDiagnostics(current);
  setExport();
}

function clear(): void {
  sequence += 1;
  input.value = "";
  report = null;
  badge.textContent = en.pastedText;
  setStatus(en.ready);
  render(null);
  input.focus();
}

function schedule(): void {
  window.clearTimeout(timer);
  const current = ++sequence;
  if (!input.value) {
    clear();
    return;
  }
  setStatus(en.analyzing);
  timer = window.setTimeout(() => void analyzePasted(current), 180);
}

async function analyzePasted(current: number): Promise<void> {
  try {
    const next = await invoke<AnalysisReport>("analyze_text", { text: input.value, options: opts() });
    if (current !== sequence) return;
    report = next;
    badge.textContent = `${en.pastedText} · memory`;
    render(report);
    setStatus(en.analysisUpdated);
  } catch (error) {
    if (current === sequence) setStatus(`Error: ${String(error)}`, true);
  }
}

async function openFile(): Promise<void> {
  try {
    const path = await open({
      multiple: false,
      directory: false,
      title: "Open text file",
      filters: [
        {
          name: "Text files",
          extensions: ["txt", "md", "csv", "log", "json", "xml", "yaml", "yml", "toml", "rs", "ts", "js"],
        },
      ],
    });
    if (typeof path !== "string") return;
    setStatus(en.analyzingFile);
    const next = await invoke<AnalysisReport>("analyze_file", { path, options: opts() });
    sequence += 1;
    input.value = "";
    report = next;
    badge.textContent = `${next.source.displayName ?? "File"} · ${next.source.mode}`;
    render(report);
    setStatus(next.source.mode === "streaming" ? en.largeFileAnalyzed : en.fileAnalyzed);
  } catch (error) {
    setStatus(`Error: ${String(error)}`, true);
  }
}

async function exportReport(format: "json" | "markdown"): Promise<void> {
  if (!report) return;
  try {
    const extension = format === "json" ? "json" : "md";
    const path = await save({
      title: `Export TextLens ${format} report`,
      defaultPath: `textlens-report.${extension}`,
      filters: [{ name: format === "json" ? "JSON" : "Markdown", extensions: [extension] }],
    });
    if (!path) return;
    await invoke("export_report", { path, report, format });
    setStatus(en.reportExported);
  } catch (error) {
    setStatus(`Error: ${String(error)}`, true);
  }
}

async function compareReport(): Promise<void> {
  if (!report) return;
  const current = report;
  try {
    const path = await open({
      multiple: false,
      directory: false,
      title: en.compareHeading,
      filters: [{ name: "TextLens JSON report", extensions: ["json"] }],
    });
    if (typeof path !== "string") return;
    const baseline = await invoke<AnalysisReport>("import_report", { path });
    renderComparison(current, baseline);
    compareDialog.showModal();
    setStatus(en.compareLoaded);
  } catch (error) {
    setStatus(`Error: ${String(error)}`, true);
  }
}

function renderComparison(current: AnalysisReport, baseline: AnalysisReport): void {
  const currentLabel = current.source.displayName ?? en.pastedText;
  const baselineLabel = baseline.source.displayName ?? en.pastedText;
  comparisonMeta.innerHTML = `<span><strong>${en.compareCurrent}:</strong> ${escapeHtml(currentLabel)}</span><span><strong>${en.compareBaseline}:</strong> ${escapeHtml(baselineLabel)}</span>`;

  comparisonMetricsBody.innerHTML = comparisonMetrics(current, baseline)
    .map(
      (item) =>
        `<tr><th scope="row">${escapeHtml(item.label)}</th><td>${escapeHtml(formatComparisonValue(item.current, item.unit))}</td><td>${escapeHtml(formatComparisonValue(item.baseline, item.unit))}</td><td class="delta ${item.delta > 0 ? "positive" : item.delta < 0 ? "negative" : "neutral"}">${escapeHtml(formatComparisonDelta(item.delta, item.unit))}</td></tr>`,
    )
    .join("");

  const changes = keywordDeltas(current, baseline);
  if (!changes.length) {
    comparisonKeywords.className = "compare-keywords empty";
    comparisonKeywords.textContent = en.compareNoKeywordChanges;
    return;
  }

  comparisonKeywords.className = "compare-keywords";
  comparisonKeywords.innerHTML = changes
    .map(
      (item) =>
        `<div><strong>${escapeHtml(item.text)}</strong><span>${formatInteger(item.current)} vs ${formatInteger(item.baseline)}</span><b class="delta ${item.delta > 0 ? "positive" : "negative"}">${escapeHtml(formatSignedInteger(item.delta))}</b></div>`,
    )
    .join("");
}

function formatComparisonValue(value: number, unit: ComparisonUnit): string {
  if (unit === "bytes") return formatBytes(value);
  if (unit === "seconds") return formatDuration(value);
  return formatInteger(value);
}

function formatComparisonDelta(value: number, unit: ComparisonUnit): string {
  if (value === 0) return "0";
  const sign = value > 0 ? "+" : "−";
  const absolute = Math.abs(value);
  if (unit === "bytes") return `${sign}${formatBytes(absolute)}`;
  if (unit === "seconds") return `${sign}${formatInteger(absolute)} s`;
  return `${sign}${formatInteger(absolute)}`;
}

function formatSignedInteger(value: number): string {
  if (value === 0) return "0";
  return `${value > 0 ? "+" : "−"}${formatInteger(Math.abs(value))}`;
}

function renderQuickActions(query = ""): void {
  const matches = filterQuickActions(quickActions, query);
  if (!matches.length) {
    quickActionsList.className = "palette-list empty";
    quickActionsList.textContent = en.quickActionsEmpty;
    return;
  }

  quickActionsList.className = "palette-list";
  quickActionsList.innerHTML = matches
    .map((action) => {
      const disabled = action.requiresReport && !report;
      return `<button type="button" data-quick-action="${action.id}"${disabled ? " disabled" : ""}><span>${escapeHtml(action.label)}</span>${disabled ? `<small>${en.nothingToShow}</small>` : ""}</button>`;
    })
    .join("");
}

function openQuickActions(): void {
  quickActionsSearch.value = "";
  renderQuickActions();
  quickActionsDialog.showModal();
  window.requestAnimationFrame(() => quickActionsSearch.focus());
}

function runQuickAction(id: QuickActionId): void {
  quickActionsDialog.close();
  switch (id) {
    case "focus-editor":
      input.focus();
      break;
    case "open-file":
      void openFile();
      break;
    case "clear":
      clear();
      break;
    case "export-json":
      void exportReport("json");
      break;
    case "export-markdown":
      void exportReport("markdown");
      break;
    case "compare":
      void compareReport();
      break;
    case "settings":
      syncSettings();
      settingsDialog.showModal();
      break;
    case "about":
      aboutDialog.showModal();
      break;
  }
}

async function backupSettings(): Promise<void> {
  try {
    const path = await save({
      title: "Back up TextLens settings",
      defaultPath: "textlens-settings.json",
      filters: [{ name: "TextLens settings", extensions: ["json"] }],
    });
    if (!path) return;
    await invoke("export_settings", { path, settings });
    setStatus(en.settingsBackupSaved);
  } catch (error) {
    setStatus(`Error: ${String(error)}`, true);
  }
}

async function restoreSettings(): Promise<void> {
  try {
    const path = await open({
      multiple: false,
      directory: false,
      title: "Restore TextLens settings",
      filters: [{ name: "TextLens settings", extensions: ["json"] }],
    });
    if (typeof path !== "string") return;
    const restored = await invoke<AppSettings>("import_settings", { path });
    settings = parseSettings(restored);
    saveSettings(settings);
    applySettings();
    syncSettings();
    setStatus(en.settingsRestored);
    if (input.value) schedule();
  } catch (error) {
    setStatus(`Error: ${String(error)}`, true);
  }
}

function syncSettings(): void {
  get<HTMLSelectElement>("themeSelect").value = settings.theme;
  get<HTMLInputElement>("readingWpmInput").value = String(settings.readingWpm);
  get<HTMLInputElement>("speakingWpmInput").value = String(settings.speakingWpm);
  get<HTMLInputElement>("topKeywordsInput").value = String(settings.topKeywords);
  get<HTMLInputElement>("topNgramsInput").value = String(settings.topNgrams);
  get<HTMLTextAreaElement>("keywordExclusionsInput").value = settings.keywordExclusions.join(", ");
  get<HTMLInputElement>("reducedMotionInput").checked = settings.reducedMotion;
}

function bounded(id: string, min: number, max: number, fallback: number): number {
  const value = Number(get<HTMLInputElement>(id).value);
  return Number.isFinite(value) ? Math.round(Math.min(max, Math.max(min, value))) : fallback;
}

function applySettings(): void {
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.dataset.reducedMotion = String(settings.reducedMotion);
}

function saveSettingsForm(event: Event): void {
  event.preventDefault();
  const keywordExclusions = get<HTMLTextAreaElement>("keywordExclusionsInput")
    .value.split(/[\n,]+/)
    .map((value) => value.trim());
  settings = parseSettings({
    theme: get<HTMLSelectElement>("themeSelect").value as ThemePreference,
    readingWpm: bounded("readingWpmInput", 30, 1000, settings.readingWpm),
    speakingWpm: bounded("speakingWpmInput", 30, 1000, settings.speakingWpm),
    topKeywords: bounded("topKeywordsInput", 1, 50, settings.topKeywords),
    topNgrams: bounded("topNgramsInput", 1, 50, settings.topNgrams),
    keywordExclusions,
    reducedMotion: get<HTMLInputElement>("reducedMotionInput").checked,
  });
  saveSettings(settings);
  applySettings();
  settingsDialog.close();
  setStatus(en.settingsSaved);
  if (input.value) schedule();
}

get<HTMLButtonElement>("openButton").onclick = () => void openFile();
get<HTMLButtonElement>("clearButton").onclick = clear;
input.addEventListener("input", schedule);
exportJson.onclick = () => void exportReport("json");
exportMd.onclick = () => void exportReport("markdown");
compareButton.onclick = () => void compareReport();
get<HTMLButtonElement>("quickActionsButton").onclick = openQuickActions;
get<HTMLButtonElement>("settingsButton").onclick = () => {
  syncSettings();
  settingsDialog.showModal();
};
get<HTMLButtonElement>("aboutButton").onclick = () => aboutDialog.showModal();
get<HTMLButtonElement>("closeAboutButton").onclick = () => aboutDialog.close();
get<HTMLButtonElement>("closeCompareButton").onclick = () => compareDialog.close();
get<HTMLButtonElement>("closeQuickActionsButton").onclick = () => quickActionsDialog.close();
get<HTMLButtonElement>("dismissOnboarding").onclick = () => {
  localStorage.setItem("textlens.onboarding.dismissed", "1");
  get("onboarding").hidden = true;
  input.focus();
};
get<HTMLButtonElement>("resetSettingsButton").onclick = () => {
  settings = { ...defaultSettings, keywordExclusions: [] };
  saveSettings(settings);
  applySettings();
  syncSettings();
  setStatus(en.defaultsRestored);
};
get<HTMLButtonElement>("backupSettingsButton").onclick = () => void backupSettings();
get<HTMLButtonElement>("restoreSettingsButton").onclick = () => void restoreSettings();
get<HTMLFormElement>("settingsForm").addEventListener("submit", saveSettingsForm);
quickActionsSearch.addEventListener("input", () => renderQuickActions(quickActionsSearch.value));
quickActionsList.addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>("[data-quick-action]");
  if (!button || button.disabled) return;
  const id = button.dataset.quickAction as QuickActionId | undefined;
  if (id) runQuickAction(id);
});

document.querySelectorAll<HTMLButtonElement>("[data-ngram]").forEach((button) => {
  button.onclick = () => {
    ngram = button.dataset.ngram === "3" ? 3 : 2;
    document
      .querySelectorAll("[data-ngram]")
      .forEach((element) => element.classList.toggle("active", element === button));
    renderFrequency(ngrams, report ? (ngram === 2 ? report.bigrams : report.trigrams) : []);
  };
});

document.querySelectorAll<HTMLButtonElement>("[data-external]").forEach((button) => {
  button.onclick = () => {
    const url = button.dataset.external;
    if (url) void openUrl(url).catch((error) => setStatus(`Error: ${String(error)}`, true));
  };
});

window.addEventListener("keydown", (event) => {
  if (!(event.ctrlKey || event.metaKey)) return;
  const key = event.key.toLowerCase();
  if (key === "p" && event.shiftKey) {
    event.preventDefault();
    if (!quickActionsDialog.open) openQuickActions();
  } else if (key === "o") {
    event.preventDefault();
    void openFile();
  } else if (key === "e" && report) {
    event.preventDefault();
    void exportReport("markdown");
  } else if (key === "k") {
    event.preventDefault();
    input.focus();
  }
});

if (localStorage.getItem("textlens.onboarding.dismissed") === "1") {
  get("onboarding").hidden = true;
}
applySettings();
syncSettings();
render(null);
