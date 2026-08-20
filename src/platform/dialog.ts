import { open as openPortable, save as savePortable } from "./web-dialog";

type OpenOptions = Parameters<typeof import("@tauri-apps/plugin-dialog").open>[0];
type SaveOptions = Parameters<typeof import("@tauri-apps/plugin-dialog").save>[0];

export async function open(options: OpenOptions): Promise<string | null> {
  if (isPortableFileRuntime()) {
    return openPortable(options);
  }

  const { open: openNative } = await import("@tauri-apps/plugin-dialog");
  return (await openNative(options)) as string | null;
}

export async function save(options: SaveOptions): Promise<string | null> {
  if (isPortableFileRuntime()) {
    return savePortable(options);
  }

  const { save: saveNative } = await import("@tauri-apps/plugin-dialog");
  return saveNative(options);
}

function isPortableFileRuntime(): boolean {
  return import.meta.env.MODE === "web" || import.meta.env.MODE === "mobile";
}
