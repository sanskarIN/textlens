import { describe, expect, it } from "vitest";

import { filterQuickActions, type SearchableAction } from "./quickActions";

const actions: SearchableAction[] = [
  { id: "open", label: "Open file", keywords: ["document", "local"] },
  { id: "export", label: "Export Markdown", keywords: ["save", "report"] },
  { id: "settings", label: "Settings", keywords: ["theme", "preferences"] },
];

describe("quick action filtering", () => {
  it("returns every action for an empty query", () => {
    expect(filterQuickActions(actions, "").map((action) => action.id)).toEqual([
      "open",
      "export",
      "settings",
    ]);
  });

  it("matches labels and keywords case-insensitively", () => {
    expect(filterQuickActions(actions, "LOCAL").map((action) => action.id)).toEqual(["open"]);
    expect(filterQuickActions(actions, "preferences").map((action) => action.id)).toEqual([
      "settings",
    ]);
  });

  it("requires every search term to match the same action", () => {
    expect(filterQuickActions(actions, "save report").map((action) => action.id)).toEqual([
      "export",
    ]);
    expect(filterQuickActions(actions, "save theme")).toEqual([]);
  });
});
