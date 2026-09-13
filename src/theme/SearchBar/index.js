import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  getFilterState,
  setFilterState,
  subscribeFilterState,
} from '@site/src/utils/filterStore';

/* ─── Mini FilterPanel component (rendered inside the dropdown) ─── */
function FilterPanel({ filterState }) {
  const { authorsList, tagsList, totalCount, filteredCount, isBlogListPage } = filterState;
  const { searchQuery, selectedAuthor, selectedTag, sortBy } = filterState;

  const isFiltered = searchQuery || selectedAuthor || selectedTag || sortBy !== 'date-desc';
  const popularTags = tagsList.slice(0, 12);

  function set(partial) { setFilterState(partial); }
  function reset() {
    set({ searchQuery: '', selectedAuthor: '', selectedTag: '', sortBy: 'date-desc' });
  }

  if (!isBlogListPage) {
    return (
      <div className="hax-filter-panel__not-blog">
        <span>// NAVIGATE TO</span>
        <a href="/blog">[ /BLOG ]</a>
        <span>TO USE FILTERS</span>
      </div>
    );
  }

  return (
    <>
      {/* Header row */}
      <div className="hax-filter-toolbar__header">
        <div className="hax-filter-toolbar__title">
          <span>// FILTER &amp; SORT MATRIX</span>
        </div>
        <div className="hax-filter-toolbar__count">
          SHOWING {filteredCount} OF {totalCount} POSTS
        </div>
      </div>

      {/* Controls grid */}
      <div className="hax-filter-toolbar__controls">
        <input
          type="text"
          className="hax-filter-input"
          placeholder="SEARCH POSTS, TITLES, TOPICS..."
          value={searchQuery}
          onChange={(e) => set({ searchQuery: e.target.value })}
          autoFocus
          aria-label="Filter posts by keyword"
        />

        <select
          className="hax-filter-select"
          value={selectedAuthor}
          onChange={(e) => set({ selectedAuthor: e.target.value })}
          aria-label="Filter by author">
          <option value="">ALL AUTHORS ({authorsList.length})</option>
          {authorsList.map((a) => (
            <option key={a} value={a}>{a.toUpperCase()}</option>
          ))}
        </select>

        <select
          className="hax-filter-select"
          value={selectedTag}
          onChange={(e) => set({ selectedTag: e.target.value })}
          aria-label="Filter by tag">
          <option value="">ALL TAGS ({tagsList.length})</option>
          {tagsList.map((t) => (
            <option key={t} value={t}>#{t.toUpperCase()}</option>
          ))}
        </select>

        <select
          className="hax-filter-select"
          value={sortBy}
          onChange={(e) => set({ sortBy: e.target.value })}
          aria-label="Sort posts">
          <option value="date-desc">NEWEST FIRST</option>
          <option value="date-asc">OLDEST FIRST</option>
          <option value="reading-asc">READ TIME: SHORTEST</option>
          <option value="reading-desc">READ TIME: LONGEST</option>
          <option value="title-asc">TITLE: A &rarr; Z</option>
          <option value="title-desc">TITLE: Z &rarr; A</option>
        </select>
      </div>

      {/* Topic pills */}
      {popularTags.length > 0 && (
        <div className="hax-filter-pills">
          <span className="hax-filter-pills__label">TOPICS:</span>
          {popularTags.map((tag) => {
            const isActive = selectedTag.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                type="button"
                className={'hax-filter-pill ' + (isActive ? 'hax-filter-pill--active' : '')}
                onClick={() => set({ selectedTag: isActive ? '' : tag })}>
                #{tag}
              </button>
            );
          })}
          {isFiltered && (
            <button
              type="button"
              className="hax-filter-reset-btn"
              style={{ marginLeft: 'auto', padding: '2px 8px', fontSize: '0.6rem' }}
              onClick={reset}>
              [x] RESET
            </button>
          )}
        </div>
      )}
    </>
  );
}

/* ─── Main SearchBar component ─── */
export default function SearchBar() {
  const [filterState, setLocalState] = useState(() => getFilterState());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const unsub = subscribeFilterState(setLocalState);
    return unsub;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isMounted) return;
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setFilterState({ isOpen: !getFilterState().isOpen });
      }
      if (e.key === 'Escape') setFilterState({ isOpen: false });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMounted]);

  const toggle = useCallback(() => {
    setFilterState({ isOpen: !getFilterState().isOpen });
  }, []);

  const isActive =
    filterState.searchQuery ||
    filterState.selectedAuthor ||
    filterState.selectedTag ||
    filterState.sortBy !== 'date-desc';

  return (
    <>
      {/* Navbar search button */}
      <button
        type="button"
        className={
          'hax-search-btn' +
          (filterState.isOpen ? ' hax-search-btn--open' : '') +
          (isActive ? ' hax-search-btn--active' : '')
        }
        onClick={toggle}
        aria-label="Search and filter blog posts"
        aria-expanded={filterState.isOpen}
        aria-haspopup="dialog">
        <span className="hax-search-btn__label">SEARCH</span>
        <span className="hax-search-btn__kbd">[ctrl K]</span>
      </button>

      {/* Dropdown panel — portal so it escapes navbar stacking context */}
      {isMounted && filterState.isOpen && createPortal(
        <>
          {/* Backdrop — click to close */}
          <div
            className="hax-filter-backdrop"
            onClick={() => setFilterState({ isOpen: false })}
            aria-hidden="true"
          />
          {/* Panel */}
          <div
            className="hax-filter-panel"
            role="dialog"
            aria-label="Blog filter and sort panel">
            <FilterPanel filterState={filterState} />
          </div>
        </>,
        document.body
      )}
    </>
  );
}
