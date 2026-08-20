import { invoke as invokePortable } from "./web-tauri-core";

export async function invoke<T>(
  command: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  if (isPortableAnalysisRuntime()) {
    return invokePortable<T>(command, args);
  }

  const { invoke: invokeNative } = await import("@tauri-apps/api/core");
  return invokeNative<T>(command, args);
}

function isPortableAnalysisRuntime(): boolean {
  return import.meta.env.MODE === "web" || import.meta.env.MODE === "mobile";
}
