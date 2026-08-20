const FILE_TOKEN_PREFIX = "textlens-web-file://";
const DOWNLOAD_TOKEN_PREFIX = "textlens-web-download://";

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
        const token = `${FILE_TOKEN_PREFIX}${Date.now()}-${counter++}`;
        files.set(token, file);
        finish(token);
      },
      { once: true },
    );
    input.addEventListener("cancel", () => finish(null), { once: true });

    document.body.append(input);
    input.click();
  });
}

export function getBrowserFile(token: string): File {
  const file = files.get(token);
  if (!file) throw new Error("The selected browser file is no longer available.");
  return file;
}

export function makeDownloadToken(defaultPath?: string): string {
  const safeName = sanitizeFilename(defaultPath || "textlens-export.txt");
  return `${DOWNLOAD_TOKEN_PREFIX}${encodeURIComponent(safeName)}`;
}

export async function downloadBrowserText(
  token: string,
  content: string,
  mimeType: string,
): Promise<void> {
  if (!token.startsWith(DOWNLOAD_TOKEN_PREFIX)) {
    throw new Error("Invalid browser download target.");
  }

  const filename = decodeURIComponent(token.slice(DOWNLOAD_TOKEN_PREFIX.length));
  const blob = new Blob([content], { type: mimeType });

  if (import.meta.env.MODE === "mobile" && "share" in navigator && "canShare" in navigator) {
    const file = new File([blob], filename, { type: mimeType });
    const shareData: ShareData = { files: [file], title: filename };
    if (navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return;
    }
  }

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

function sanitizeFilename(value: string): string {
  const leaf = value.split(/[\\/]/).pop() || "textlens-export.txt";
  return leaf.replace(/[<>:"|?*\u0000-\u001f]/g, "_").slice(0, 180) || "textlens-export.txt";
}
