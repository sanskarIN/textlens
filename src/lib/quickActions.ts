export interface SearchableAction {
  id: string;
  label: string;
  keywords: readonly string[];
}

export function filterQuickActions<T extends SearchableAction>(actions: readonly T[], query: string): T[] {
  const terms = query
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (!terms.length) return [...actions];

  return actions.filter((action) => {
    const haystack = `${action.label} ${action.keywords.join(" ")}`.toLocaleLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
