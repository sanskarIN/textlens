import { describe, expect, it } from "vitest";

import { parseRecentFiles, recordRecentFile, type RecentFileEntry } from "./recentFiles";

const first: RecentFileEntry = {
  name: "notes.txt",
  size: 120,
  openedAt: "2026-08-19T06:00:00.000Z",
};

describe("recent file metadata", () => {
  it("accepts display metadata without paths", () => {
    expect(parseRecentFiles([first])).toEqual([first]);
    expect(
      parseRecentFiles([
        { ...first, name: "folder/notes.txt" },
        { ...first, name: "C:\\private\\notes.txt" },
      ]),
    ).toEqual([]);
  });

  it("rejects invalid sizes and timestamps", () => {
    expect(
      parseRecentFiles([
        { ...first, size: -1 },
        { ...first, size: Number.MAX_SAFE_INTEGER + 1 },
        { ...first, openedAt: "not-a-date" },
      ]),
    ).toEqual([]);
  });

  it("moves repeated display names to the front", () => {
    const older = { ...first, openedAt: "2026-08-19T05:00:00.000Z" };
    const other = { ...first, name: "other.md" };
    expect(recordRecentFile([older, other], first)).toEqual([first, other]);
  });

  it("keeps at most ten entries", () => {
    const entries = Array.from({ length: 10 }, (_, index) => ({
      name: `file-${index}.txt`,
      size: index,
      openedAt: `2026-08-19T06:${String(index).padStart(2, "0")}:00.000Z`,
    }));
    const next = recordRecentFile(entries, {
      name: "new.txt",
      size: 99,
      openedAt: "2026-08-19T07:00:00.000Z",
    });
    expect(next).toHaveLength(10);
    expect(next[0]?.name).toBe("new.txt");
    expect(next.some((entry) => entry.name === "file-9.txt")).toBe(false);
  });
});
