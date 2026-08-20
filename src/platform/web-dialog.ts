import { makeDownloadToken, pickBrowserFile } from "./web-file-store";

interface DialogFilter {
  name?: string;
  extensions?: string[];
}

interface OpenDialogOptions {
  multiple?: boolean;
  directory?: boolean;
  filters?: DialogFilter[];
}

interface SaveDialogOptions {
  defaultPath?: string;
}

export async function open(options: OpenDialogOptions = {}): Promise<string | null> {
  if (options.directory) throw new Error("Directory selection is not available in the TextLens web app.");
  if (options.multiple) throw new Error("Multiple-file selection is not supported by this TextLens workflow.");

  const extensions = options.filters?.flatMap((filter) => filter.extensions ?? []) ?? [];
  const accept = extensions.length ? extensions.map((extension) => `.${extension.replace(/^\./, "")}`).join(",") : "text/*,.json";
  return pickBrowserFile(accept);
}

export async function save(options: SaveDialogOptions = {}): Promise<string | null> {
  return makeDownloadToken(options.defaultPath);
}
