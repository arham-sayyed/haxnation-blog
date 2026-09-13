import React from 'react';

export default function BlogFilterToolbar({
  searchQuery,
  setSearchQuery,
  selectedAuthor,
  setSelectedAuthor,
  selectedTag,
  setSelectedTag,
  sortBy,
  setSortBy,
  authorsList,
  tagsList,
  totalCount,
  filteredCount,
  onReset,
}) {
  const isFiltered = searchQuery || selectedAuthor || selectedTag || sortBy !== 'date-desc';
  const popularTags = tagsList.slice(0, 10);

  return (
    <section className="hax-filter-toolbar" aria-label="Blog post filters and sorting">
      <div className="hax-filter-toolbar__header">
        <div className="hax-filter-toolbar__title">
          <span>// FILTER &amp; SORT MATRIX</span>
        </div>
        <div className="hax-filter-toolbar__count">
          SHOWING {filteredCount} OF {totalCount} POSTS
        </div>
      </div>

      <div className="hax-filter-toolbar__controls">
        {/* Text search query */}
        <input
          type="text"
          className="hax-filter-input"
          placeholder="SEARCH POSTS, TITLES, TOPICS..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Filter posts by keyword"
        />
        <select
          className="hax-filter-select"
          value={selectedAuthor}
          onChange={(e) => setSelectedAuthor(e.target.value)}
          aria-label="Filter posts by author">
          <option value="">ALL AUTHORS ({authorsList.length})</option>
          {authorsList.map((author) => (
            <option key={author} value={author}>
              {author.toUpperCase()}
            </option>
          ))}
        </select>

        <select
          className="hax-filter-select"
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          aria-label="Filter posts by tag">
          <option value="">ALL TAGS ({tagsList.length})</option>
          {tagsList.map((tag) => (
            <option key={tag} value={tag}>
              #{tag.toUpperCase()}
            </option>
          ))}
        </select>

        <select
          className="hax-filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort posts">
          <option value="date-desc">NEWEST FIRST</option>
          <option value="date-asc">OLDEST FIRST</option>
          <option value="reading-asc">READ TIME: SHORTEST</option>
          <option value="reading-desc">READ TIME: LONGEST</option>
          <option value="title-asc">TITLE: A &rarr; Z</option>
          <option value="title-desc">TITLE: Z &rarr; A</option>
        </select>
      </div>

      {popularTags.length > 0 && (
        <div className="hax-filter-pills">
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--hax-ink-muted)', alignSelf: 'center', marginRight: '4px' }}>
            TOPICS:
          </span>
          {popularTags.map((tag) => {
            const isActive = selectedTag.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                type="button"
                className={'hax-filter-pill ' + (isActive ? 'hax-filter-pill--active' : '')}
                onClick={() => setSelectedTag(isActive ? '' : tag)}>
                #{tag}
              </button>
            );
          })}
          {isFiltered && (
            <button
              type="button"
              className="hax-filter-reset-btn"
              onClick={onReset}
              style={{ marginLeft: 'auto', padding: '2px 8px', fontSize: '0.6rem' }}>
              [x] RESET
            </button>
          )}
        </div>
      )}
    </section>
  );
}
