const FILE_TOKEN_PREFIX = "textlens-web-file://";
const DOWNLOAD_TOKEN_PREFIX = "textlens-web-download://";
const MOBILE_SAVE_TOKEN_PREFIX = "textlens-mobile-save://";
const MAX_PORTABLE_FILE_BYTES = 64 * 1024 * 1024;

const files = new Map<string, File>();
let counter = 0;

export async function pickBrowserFile(accept: string): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = false;
    input.style.position = "fixed";
    input.style.left = "-10000px";
    input.setAttribute("aria-hidden", "true");

    let settled = false;
    const finish = (value: string | null): void => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(value);
    };

    input.addEventListener(
      "change",
      () => {
        const file = input.files?.[0];
        if (!file) {
          finish(null);
          return;
        }
        const token = storeFile(file);
        finish(token);
      },
      { once: true },
    );
    input.addEventListener("cancel", () => finish(null), { once: true });

    document.body.append(input);
    input.click();
  });
}

export async function registerMobileSelection(uri: string): Promise<string> {
  const { readFile, stat } = await import("@tauri-apps/plugin-fs");
  const metadata = await stat(uri);
  if (!metadata.isFile) {
    throw new Error("The selected mobile document is not a file.");
  }
  if (metadata.size > MAX_PORTABLE_FILE_BYTES) {
    throw new Error("This portable build accepts text files up to 64 MiB.");
  }

  const bytes = await readFile(uri);
  if (bytes.byteLength > MAX_PORTABLE_FILE_BYTES) {
    throw new Error("This portable build accepts text files up to 64 MiB.");
  }

  const displayName = mobileDisplayName(uri);
  const file = new File([bytes], displayName, { type: "text/plain" });
  return storeFile(file);
}

export function getBrowserFile(token: string): File {
  const file = files.get(token);
  if (!file) throw new Error("The selected portable file is no longer available.");
  return file;
}

export function makeDownloadToken(defaultPath?: string): string {
  const safeName = sanitizeFilename(defaultPath || "textlens-export.txt");
  return `${DOWNLOAD_TOKEN_PREFIX}${encodeURIComponent(safeName)}`;
}

export function makeMobileDownloadToken(uri: string): string {
  return `${MOBILE_SAVE_TOKEN_PREFIX}${encodeURIComponent(uri)}`;
}

export async function downloadBrowserText(
  token: string,
  content: string,
  mimeType: string,
): Promise<void> {
  if (token.startsWith(MOBILE_SAVE_TOKEN_PREFIX)) {
    const uri = decodeURIComponent(token.slice(MOBILE_SAVE_TOKEN_PREFIX.length));
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");
    await writeTextFile(uri, content);
    return;
  }

  if (!token.startsWith(DOWNLOAD_TOKEN_PREFIX)) {
    throw new Error("Invalid browser download target.");
  }

  const filename = decodeURIComponent(token.slice(DOWNLOAD_TOKEN_PREFIX.length));
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function storeFile(file: File): string {
  const token = `${FILE_TOKEN_PREFIX}${Date.now()}-${counter++}`;
  files.set(token, file);
  return token;
}

function mobileDisplayName(uri: string): string {
  try {
    const decoded = decodeURIComponent(uri);
    const leaf = decoded.split(/[\\/]/).pop();
    if (leaf) return sanitizeFilename(leaf);
  } catch {
    // Fall through to a privacy-safe generic display name.
  }
  return "Selected document.txt";
}

function sanitizeFilename(value: string): string {
  const leaf = value.split(/[\\/]/).pop() || "textlens-export.txt";
  return leaf.replace(/[<>:"|?*\u0000-\u001f]/g, "_").slice(0, 180) || "textlens-export.txt";
}
