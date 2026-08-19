import { en } from "./i18n/en";
import { defaultReportExportOptions, parseReportExportOptions } from "./lib/reportExportOptions";
import type { ReportExportOptions } from "./types";
import "./report-export.css";

export interface MarkdownExportUi {
  open: () => void;
}

export function mountMarkdownExportUi(
  onExport: (options: ReportExportOptions) => void,
): MarkdownExportUi {
  const dialog = document.createElement("dialog");
  dialog.className = "report-export-dialog";
  dialog.setAttribute("aria-labelledby", "markdownExportHeading");
  dialog.innerHTML = `
    <form id="markdownExportForm" method="dialog">
      <div class="heading">
        <div>
          <p class="eyebrow">${en.markdownExportEyebrow}</p>
          <h2 id="markdownExportHeading">${en.markdownExportHeading}</h2>
        </div>
        <button id="closeMarkdownExportButton" class="ghost" type="button">${en.close}</button>
      </div>
      <p class="dialog-copy">${en.markdownExportBody}</p>
      <div class="report-export-options">
        <label class="report-export-option report-export-option-wide">
          <input id="exportSourceMetadataInput" type="checkbox">
          <span><strong>${en.includeSourceMetadata}</strong><small>${en.includeSourceMetadataHint}</small></span>
        </label>
        <label class="report-export-option">
          <input id="exportCoreMetricsInput" type="checkbox">
          <span><strong>${en.includeCoreMetrics}</strong></span>
        </label>
        <label class="report-export-option">
          <input id="exportKeywordsInput" type="checkbox">
          <span><strong>${en.includeKeywordsSection}</strong></span>
        </label>
        <label class="report-export-option">
          <input id="exportBigramsInput" type="checkbox">
          <span><strong>${en.includeBigramsSection}</strong></span>
        </label>
        <label class="report-export-option">
          <input id="exportTrigramsInput" type="checkbox">
          <span><strong>${en.includeTrigramsSection}</strong></span>
        </label>
        <label class="report-export-option report-export-option-wide">
          <input id="exportWhitespaceInput" type="checkbox">
          <span><strong>${en.includeWhitespaceSection}</strong></span>
        </label>
      </div>
      <div class="actions end report-export-actions">
        <button id="confirmMarkdownExportButton" class="primary" type="submit">${en.exportSelectedMarkdown}</button>
      </div>
    </form>`;
  document.body.append(dialog);

  const form = requireElement<HTMLFormElement>(dialog, "#markdownExportForm");
  const closeButton = requireElement<HTMLButtonElement>(dialog, "#closeMarkdownExportButton");
  const sourceMetadata = requireElement<HTMLInputElement>(dialog, "#exportSourceMetadataInput");
  const coreMetrics = requireElement<HTMLInputElement>(dialog, "#exportCoreMetricsInput");
  const keywords = requireElement<HTMLInputElement>(dialog, "#exportKeywordsInput");
  const bigrams = requireElement<HTMLInputElement>(dialog, "#exportBigramsInput");
  const trigrams = requireElement<HTMLInputElement>(dialog, "#exportTrigramsInput");
  const whitespace = requireElement<HTMLInputElement>(dialog, "#exportWhitespaceInput");

  let selected = { ...defaultReportExportOptions };

  const writeSelection = (): void => {
    sourceMetadata.checked = selected.includeSourceMetadata;
    coreMetrics.checked = selected.includeCoreMetrics;
    keywords.checked = selected.includeKeywords;
    bigrams.checked = selected.includeBigrams;
    trigrams.checked = selected.includeTrigrams;
    whitespace.checked = selected.includeWhitespace;
  };

  const readSelection = (): ReportExportOptions =>
    parseReportExportOptions({
      includeSourceMetadata: sourceMetadata.checked,
      includeCoreMetrics: coreMetrics.checked,
      includeKeywords: keywords.checked,
      includeBigrams: bigrams.checked,
      includeTrigrams: trigrams.checked,
      includeWhitespace: whitespace.checked,
    });

  closeButton.addEventListener("click", () => dialog.close());
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    selected = readSelection();
    dialog.close();
    onExport(selected);
  });

  return {
    open: () => {
      if (dialog.open) return;
      writeSelection();
      dialog.showModal();
      window.requestAnimationFrame(() => sourceMetadata.focus());
    },
  };
}

function requireElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}
