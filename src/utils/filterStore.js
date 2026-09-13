/**
 * filterStore.js — Singleton pub/sub store for blog filter state.
 * Shared between BlogListPage (data provider) and SearchBar (UI).
 * Safe for SSR: writes/dispatches are guarded by isMounted checks in consumers.
 */

const _state = {
  isOpen: false,
  searchQuery: '',
  selectedAuthor: '',
  selectedTag: '',
  sortBy: 'date-desc',
  // set by BlogListPage on mount
  authorsList: [],
  tagsList: [],
  totalCount: 0,
  filteredCount: 0,
  isBlogListPage: false,
};

const _listeners = new Set();

export function getFilterState() {
  return { ..._state };
}

export function setFilterState(partial) {
  Object.assign(_state, partial);
  const snapshot = { ..._state };
  _listeners.forEach((fn) => {
    try { fn(snapshot); } catch (_) {}
  });
}

export function subscribeFilterState(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
