import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { en } from "./i18n/en";
import { formatBytes, formatDuration, formatInteger } from "./lib/format";
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
      <button id="settingsButton" class="ghost" type="button">Settings</button>
      <button id="aboutButton" class="ghost" type="button">About</button>
    </nav>
  </header>
  <main id="workspace" class="workspace">
    <section id="onboarding" class="onboarding" aria-labelledby="welcomeTitle">
      <div>
        <p class="eyebrow">Welcome to TextLens</p>
        <h1 id="welcomeTitle">See what your text is made of.</h1>
        <p>Paste text for live analysis or open a local file. Analysis happens on this device with no sign-in.</p>
      </div>
      <button id="dismissOnboarding" class="ghost" type="button">Got it</button>
    </section>

    <section class="panel editor-panel" aria-labelledby="inputHeading">
      <div class="heading">
        <div><p class="eyebrow">Workspace</p><h2 id="inputHeading">${en.inputLabel}</h2></div>
        <div class="actions">
          <button id="openButton" class="primary" type="button">${en.openFile}</button>
          <button id="clearButton" type="button">${en.clear}</button>
        </div>
      </div>
      <label class="sr-only" for="textInput">${en.inputLabel}</label>
      <textarea id="textInput" spellcheck="true" autocomplete="off" placeholder="${en.inputPlaceholder}" aria-describedby="privacyHint analysisStatus"></textarea>
      <div class="editor-footer">
        <p id="privacyHint">${en.privacyNote}</p>
        <p id="analysisStatus" role="status" aria-live="polite">Ready</p>
      </div>
    </section>

    <section aria-labelledby="overviewHeading">
      <div class="heading compact">
        <div><p class="eyebrow">Overview</p><h2 id="overviewHeading">Live metrics</h2></div>
        <span id="sourceBadge" class="badge">Pasted text</span>
      </div>
      <div id="metricsGrid" class="metrics" aria-live="polite"></div>
    </section>

    <div class="columns">
      <section class="panel">
        <div class="heading compact"><div><p class="eyebrow">Language</p><h2>Keywords</h2></div></div>
        <div id="keywordsList" class="frequency empty">Nothing to show yet.</div>
      </section>
      <section class="panel">
        <div class="heading compact">
          <div><p class="eyebrow">Patterns</p><h2>N-grams</h2></div>
          <div class="segmented" role="group" aria-label="N-gram size">
            <button class="active" data-ngram="2" type="button">2-word</button>
            <button data-ngram="3" type="button">3-word</button>
          </div>
        </div>
        <div id="ngramsList" class="frequency empty">Nothing to show yet.</div>
      </section>
    </div>

    <section class="panel">
      <div class="heading compact"><div><p class="eyebrow">Quality</p><h2>Whitespace & line endings</h2></div></div>
      <div id="diagnosticsGrid" class="diagnostics"></div>
    </section>

    <section class="panel export">
      <div>
        <p class="eyebrow">Portable results</p>
        <h2>Export this analysis</h2>
        <p>Save aggregate results as JSON or Markdown. Source text is never included.</p>
      </div>
      <div class="actions">
        <button id="exportJsonButton" type="button" disabled>${en.exportJson}</button>
        <button id="exportMarkdownButton" type="button" disabled>${en.exportMarkdown}</button>
      </div>
    </section>
  </main>
  <footer>
    <span>${en.watermark}</span><span>•</span>
    <button class="link" data-external="https://github.com/sanskarIN/textlens" type="button">GitHub</button><span>•</span>
    <button class="link" data-external="https://buymeacoffee.com/sanskarIN" type="button">Buy Me a Coffee</button>
  </footer>
</div>

<dialog id="settingsDialog">
  <form id="settingsForm" method="dialog">
    <div class="heading">
      <div><p class="eyebrow">Preferences</p><h2>Settings</h2></div>
      <button value="cancel" class="ghost" aria-label="Close settings">Close</button>
    </div>
    <div class="settings">
      <label>Theme
        <select id="themeSelect">
          <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
        </select>
      </label>
      <label>Reading speed (words/min)<input id="readingWpmInput" type="number" min="30" max="1000"></label>
      <label>Speaking speed (words/min)<input id="speakingWpmInput" type="number" min="30" max="1000"></label>
      <label>Top keywords<input id="topKeywordsInput" type="number" min="1" max="50"></label>
      <label>Top n-grams<input id="topNgramsInput" type="number" min="1" max="50"></label>
      <label class="check"><input id="reducedMotionInput" type="checkbox">Reduce non-essential motion</label>
    </div>
    <div class="privacy">
      <h3>Privacy & data</h3>
      <p>Document contents stay local. Preferences use local WebView storage. Export occurs only to a path you choose.</p>
      <div class="actions">
        <button id="backupSettingsButton" type="button">Back up settings</button>
        <button id="restoreSettingsButton" type="button">Restore settings</button>
      </div>
    </div>
    <div class="actions end">
      <button id="resetSettingsButton" type="button">Restore defaults</button>
      <button id="saveSettingsButton" class="primary" type="submit">Save settings</button>
    </div>
  </form>
</dialog>

<dialog id="aboutDialog">
  <div>
    <div class="heading">
      <div><p class="eyebrow">TextLens 0.1.0</p><h2>About</h2></div>
      <button id="closeAboutButton" class="ghost" type="button">Close</button>
    </div>
    <img class="about-logo" src="/logo.svg" alt="TextLens logo" width="76" height="76">
    <p>Open-source, privacy-first desktop word counting and text diagnostics built with Rust, Tauri, TypeScript, and Vite.</p>
    <dl>
      <div><dt>License</dt><dd>MIT</dd></div>
      <div><dt>Business</dt><dd>sanskarin@outlook.in</dd></div>
      <div><dt>Business</dt><dd>sanskarin.business@gmail.com</dd></div>
      <div><dt>Support</dt><dd>supportramsandesh@gmail.com</dd></div>
    </dl>
    <div class="actions">
      <button data-external="https://github.com/sanskarIN/textlens" type="button">View source</button>
      <button class="primary" data-external="https://buymeacoffee.com/sanskarIN" type="button">Buy Me a Coffee</button>
    </div>
    <p class="credit">${en.watermark}</p>
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
const settingsDialog = get<HTMLDialogElement>("settingsDialog");
const aboutDialog = get<HTMLDialogElement>("aboutDialog");

let settings = loadSettings();
let report: AnalysisReport | null = null;
let ngram: 2 | 3 = 2;
let timer: number | undefined;
let sequence = 0;

const opts = (): AnalysisOptions => ({
  readingWpm: settings.readingWpm,
  speakingWpm: settings.speakingWpm,
  topKeywords: settings.topKeywords,
  topNgrams: settings.topNgrams,
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[
      character
    ] ?? character,
  );
}

function setStatus(message: string, error = false): void {
  status.textContent = message;
  status.classList.toggle("error", error);
}

function setExport(): void {
  exportJson.disabled = !report;
  exportMd.disabled = !report;
}

function renderMetrics(current: AnalysisReport | null): void {
  const rows = current
    ? [
        ["Words", formatInteger(current.stats.words)],
        ["Unique words", formatInteger(current.stats.uniqueWords)],
        ["Longest word", `${formatInteger(current.stats.maxWordCharacters)} chars`],
        ["Characters", formatInteger(current.stats.characters)],
        ["Sentences", formatInteger(current.stats.sentences)],
        ["Paragraphs", formatInteger(current.stats.paragraphs)],
        ["Lines", formatInteger(current.stats.lines)],
        ["Bytes", formatBytes(current.stats.bytes)],
        ["Reading time", formatDuration(current.stats.readingSeconds)],
        ["Speaking time", formatDuration(current.stats.speakingSeconds)],
      ]
    : [
        ["Words", "—"],
        ["Unique words", "—"],
        ["Longest word", "—"],
        ["Characters", "—"],
        ["Sentences", "—"],
        ["Paragraphs", "—"],
        ["Lines", "—"],
        ["Bytes", "—"],
        ["Reading time", "—"],
        ["Speaking time", "—"],
      ];
  metrics.innerHTML = rows
    .map(
      ([key, value]) =>
        `<article><span>${escapeHtml(key)}</span><strong>${escapeHtml(value)}</strong></article>`,
    )
    .join("");
}

function renderFrequency(element: HTMLElement, items: FrequencyItem[]): void {
  if (!items.length) {
    element.className = "frequency empty";
    element.textContent = "Nothing to show yet.";
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
    diagnostics.innerHTML = ["Line endings", "Blank lines", "Trailing whitespace", "Encoding"]
      .map((label) => `<div><span>${label}</span><strong>—</strong></div>`)
      .join("");
    return;
  }
  const endings = current.whitespace.lineEndings;
  const encoding = current.encoding
    ? `${current.encoding.name}${current.encoding.fallbackUsed ? " · fallback" : ""}${current.encoding.hadErrors ? " · replacement chars" : ""}`
    : "UTF-8 text";
  diagnostics.innerHTML = `
    <div><span>Line endings</span><strong>${escapeHtml(endings.dominant)}${endings.mixed ? " · mixed" : ""}</strong></div>
    <div><span>Blank lines</span><strong>${formatInteger(current.whitespace.blankLines)}</strong></div>
    <div><span>Trailing whitespace lines</span><strong>${formatInteger(current.whitespace.trailingWhitespaceLines)}</strong></div>
    <div><span>Encoding</span><strong>${escapeHtml(encoding)}</strong></div>
    <div><span>Spaces</span><strong>${formatInteger(current.whitespace.spaces)}</strong></div>
    <div><span>Tabs</span><strong>${formatInteger(current.whitespace.tabs)}</strong></div>
    <div><span>LF / CRLF / CR</span><strong>${endings.lf} / ${endings.crlf} / ${endings.cr}</strong></div>
    <div><span>Graphemes</span><strong>${formatInteger(current.stats.graphemes)}</strong></div>`;
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
  badge.textContent = "Pasted text";
  setStatus("Ready");
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
  setStatus("Analyzing…");
  timer = window.setTimeout(() => void analyzePasted(current), 180);
}

async function analyzePasted(current: number): Promise<void> {
  try {
    const next = await invoke<AnalysisReport>("analyze_text", { text: input.value, options: opts() });
    if (current !== sequence) return;
    report = next;
    badge.textContent = "Pasted text · memory";
    render(report);
    setStatus("Analysis updated");
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
    setStatus("Analyzing file…");
    const next = await invoke<AnalysisReport>("analyze_file", { path, options: opts() });
    sequence += 1;
    input.value = "";
    report = next;
    badge.textContent = `${next.source.displayName ?? "File"} · ${next.source.mode}`;
    render(report);
    setStatus(
      next.source.mode === "streaming"
        ? "Large file analyzed in streaming mode"
        : "File analyzed",
    );
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
    setStatus("Report exported");
  } catch (error) {
    setStatus(`Error: ${String(error)}`, true);
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
    setStatus("Settings backup saved");
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
    setStatus("Settings restored");
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
  settings = {
    theme: get<HTMLSelectElement>("themeSelect").value as ThemePreference,
    readingWpm: bounded("readingWpmInput", 30, 1000, settings.readingWpm),
    speakingWpm: bounded("speakingWpmInput", 30, 1000, settings.speakingWpm),
    topKeywords: bounded("topKeywordsInput", 1, 50, settings.topKeywords),
    topNgrams: bounded("topNgramsInput", 1, 50, settings.topNgrams),
    reducedMotion: get<HTMLInputElement>("reducedMotionInput").checked,
  };
  saveSettings(settings);
  applySettings();
  settingsDialog.close();
  setStatus("Settings saved");
  if (input.value) schedule();
}

get<HTMLButtonElement>("openButton").onclick = () => void openFile();
get<HTMLButtonElement>("clearButton").onclick = clear;
input.addEventListener("input", schedule);
exportJson.onclick = () => void exportReport("json");
exportMd.onclick = () => void exportReport("markdown");
get<HTMLButtonElement>("settingsButton").onclick = () => {
  syncSettings();
  settingsDialog.showModal();
};
get<HTMLButtonElement>("aboutButton").onclick = () => aboutDialog.showModal();
get<HTMLButtonElement>("closeAboutButton").onclick = () => aboutDialog.close();
get<HTMLButtonElement>("dismissOnboarding").onclick = () => {
  localStorage.setItem("textlens.onboarding.dismissed", "1");
  get("onboarding").hidden = true;
  input.focus();
};
get<HTMLButtonElement>("resetSettingsButton").onclick = () => {
  settings = { ...defaultSettings };
  saveSettings(settings);
  applySettings();
  syncSettings();
  setStatus("Default settings restored");
};
get<HTMLButtonElement>("backupSettingsButton").onclick = () => void backupSettings();
get<HTMLButtonElement>("restoreSettingsButton").onclick = () => void restoreSettings();
get<HTMLFormElement>("settingsForm").addEventListener("submit", saveSettingsForm);

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
  if (key === "o") {
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
