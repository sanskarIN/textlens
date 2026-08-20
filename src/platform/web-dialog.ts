import {
  makeDownloadToken,
  makeMobileDownloadToken,
  pickBrowserFile,
  registerMobileSelection,
} from "./web-file-store";

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
  filters?: DialogFilter[];
}

interface GlobalDialogApi {
  open(options?: OpenDialogOptions): Promise<string | string[] | null>;
  save(options?: SaveDialogOptions): Promise<string | null>;
}

export async function open(options: OpenDialogOptions = {}): Promise<string | null> {
  if (options.directory) {
    throw new Error("Directory selection is not available in this TextLens workflow.");
  }
  if (options.multiple) {
    throw new Error("Multiple-file selection is not supported by this TextLens workflow.");
  }

  if (import.meta.env.MODE === "mobile") {
    const selected = await mobileDialog().open(options);
    if (Array.isArray(selected)) {
      if (selected.length === 0) return null;
      return registerMobileSelection(selected[0]);
    }
    return selected ? registerMobileSelection(selected) : null;
  }

  const extensions = options.filters?.flatMap((filter) => filter.extensions ?? []) ?? [];
  const accept = extensions.length
    ? extensions.map((extension) => `.${extension.replace(/^\./, "")}`).join(",")
    : "text/*,.json";
  return pickBrowserFile(accept);
}

export async function save(options: SaveDialogOptions = {}): Promise<string | null> {
  if (import.meta.env.MODE === "mobile") {
    const selected = await mobileDialog().save(options);
    return selected ? makeMobileDownloadToken(selected) : null;
  }
  return makeDownloadToken(options.defaultPath);
}

function mobileDialog(): GlobalDialogApi {
  const tauriWindow = window as Window & {
    __TAURI__?: { dialog?: GlobalDialogApi };
  };
  const dialog = tauriWindow.__TAURI__?.dialog;
  if (!dialog) {
    throw new Error("The native mobile document dialog is unavailable.");
  }
  return dialog;
}
