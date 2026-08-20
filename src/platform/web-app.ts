import packageMetadata from "../../package.json";

export async function getVersion(): Promise<string> {
  return packageMetadata.version;
}
