import React, { useState, useMemo, useEffect } from 'react';
import clsx from 'clsx';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import BlogLayout from '@theme/BlogLayout';
import BlogPostItems from '@theme/BlogPostItems';
import BlogListPaginator from '@theme/BlogListPaginator';
import SearchMetadata from '@theme/SearchMetadata';
import {
  getFilterState,
  setFilterState,
  subscribeFilterState,
} from '@site/src/utils/filterStore';

export default function BlogListPage(props) {
  const { metadata, items, sidebar } = props;
  const { blogTitle, blogDescription } = metadata;
  const searchIndexUrl = useBaseUrl('blog-index.json');
  const [fullPostIndex, setFullPostIndex] = useState(null);
  const pagePostIndex = useMemo(() => items.map(({ content: BlogPostContent }) => {
    const postMeta = BlogPostContent.metadata;
    return {
      title: postMeta.title,
      description: postMeta.description || '',
      permalink: postMeta.permalink,
      date: postMeta.date,
      readingTime: postMeta.readingTime || 0,
      authors: (postMeta.authors || []).map(({ name }) => ({ name })),
      tags: (postMeta.tags || []).map(({ label }) => ({ label })),
    };
  }), [items]);
  const postIndex = fullPostIndex || pagePostIndex;

  // Initialise local filter params from store (so state persists across renders)
  const [searchQuery, setSearchQuery] = useState(() => getFilterState().searchQuery);
  const [selectedAuthor, setSelectedAuthor] = useState(() => getFilterState().selectedAuthor);
  const [selectedTag, setSelectedTag] = useState(() => getFilterState().selectedTag);
  const [sortBy, setSortBy] = useState(() => getFilterState().sortBy);

  useEffect(() => {
    let isCurrent = true;
    fetch(searchIndexUrl)
      .then((response) => response.ok ? response.json() : [])
      .then((posts) => {
        if (!isCurrent) return;
        setFullPostIndex(posts.map((post) => ({
          ...post,
          permalink: post.url,
          authors: (post.authors || []).map((name) => ({ name })),
          tags: (post.tags || []).map((label) => ({ label })),
        })));
      })
      .catch(() => {});
    return () => { isCurrent = false; };
  }, [searchIndexUrl]);

  // Subscribe to store changes (SearchBar writes filter params here)
  useEffect(() => {
    const unsub = subscribeFilterState((state) => {
      setSearchQuery(state.searchQuery);
      setSelectedAuthor(state.selectedAuthor);
      setSelectedTag(state.selectedTag);
      setSortBy(state.sortBy);
    });
    return unsub;
  }, []);

  // Tell the store we are on the blog list page
  useEffect(() => {
    setFilterState({ isBlogListPage: true });
    return () => setFilterState({
      isBlogListPage: false,
      authorsList: [],
      tagsList: [],
      totalCount: 0,
      filteredCount: 0,
    });
  }, []);

  // Extract unique authors & tags (case-insensitive tag dedup)
  const { authorsList, tagsList } = useMemo(() => {
    const authorsSet = new Set();
    const tagsMap = new Map();
    postIndex.forEach((postMeta) => {
      if (postMeta.authors) {
        postMeta.authors.forEach((a) => { if (a.name) authorsSet.add(a.name); });
      }
      if (postMeta.tags) {
        postMeta.tags.forEach((t) => {
          if (t.label) {
            const key = t.label.toLowerCase();
            if (!tagsMap.has(key)) tagsMap.set(key, t.label);
          }
        });
      }
    });
    return {
      authorsList: Array.from(authorsSet).sort(),
      tagsList: Array.from(tagsMap.values()).sort(),
    };
  }, [postIndex]);

  // Push author/tag lists to store so SearchBar dropdown can render them
  useEffect(() => {
    setFilterState({ authorsList, tagsList });
  }, [authorsList, tagsList]);

  // Compute filtered & sorted items
  const filteredItems = useMemo(() => {
    let result = Array.isArray(postIndex) ? [...postIndex] : [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((postMeta) => {
        return (
          postMeta.title?.toLowerCase().includes(q) ||
          postMeta.description?.toLowerCase().includes(q) ||
          postMeta.content?.toLowerCase().includes(q) ||
          postMeta.tags?.some((t) => t.label?.toLowerCase().includes(q)) ||
          postMeta.authors?.some((a) => a.name?.toLowerCase().includes(q))
        );
      });
    }

    if (selectedAuthor) {
      result = result.filter((postMeta) =>
        postMeta.authors?.some((a) => a.name === selectedAuthor)
      );
    }

    if (selectedTag) {
      result = result.filter((postMeta) =>
        postMeta.tags?.some(
          (t) => t.label?.toLowerCase() === selectedTag.toLowerCase()
        )
      );
    }

    result.sort((a, b) => {
      const metaA = a;
      const metaB = b;
      if (sortBy === 'date-asc')      return new Date(metaA.date) - new Date(metaB.date);
      if (sortBy === 'reading-asc')   return (metaA.readingTime || 0) - (metaB.readingTime || 0);
      if (sortBy === 'reading-desc')  return (metaB.readingTime || 0) - (metaA.readingTime || 0);
      if (sortBy === 'title-asc')     return (metaA.title || '').localeCompare(metaB.title || '');
      if (sortBy === 'title-desc')    return (metaB.title || '').localeCompare(metaA.title || '');
      return new Date(metaB.date) - new Date(metaA.date);
    });

    return result;
  }, [postIndex, searchQuery, selectedAuthor, selectedTag, sortBy]);

  // Push counts to store so SearchBar shows correct "X of Y" count
  useEffect(() => {
    setFilterState({ filteredCount: filteredItems.length, totalCount: postIndex.length });
  }, [filteredItems.length, postIndex.length]);

  // AOS observer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('aos-animate'); }),
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('[data-aos], article').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [filteredItems]);

  const isFiltered = searchQuery || selectedAuthor || selectedTag || sortBy !== 'date-desc';
  const filteredPermalinks = new Set(filteredItems.map((post) => post.permalink));
  const visibleItems = isFiltered
    ? items.filter(({ content }) => filteredPermalinks.has(content.metadata.permalink))
    : items.slice(0, 10);
  const visiblePermalinks = new Set(visibleItems.map(({ content }) => content.metadata.permalink));
  const additionalMatches = isFiltered
    ? filteredItems.filter((post) => !visiblePermalinks.has(post.permalink))
    : [];

  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogListPage,
        'blog-list-page'
      )}>
      <PageMetadata title={blogTitle} description={blogDescription} />
      <SearchMetadata tag="blog_posts_list" />

      <BlogLayout sidebar={sidebar}>
        {filteredItems.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              border: 'var(--hax-border)',
              background: 'var(--hax-surface)',
              boxShadow: 'var(--hax-shadow)',
              marginBottom: '2rem',
            }}>
            <h3 style={{ fontFamily: 'var(--hax-mono)', fontSize: '1rem', textTransform: 'uppercase', color: 'var(--hax-red)' }}>
              [ NO MATCHING POSTS FOUND ]
            </h3>
            <p style={{ fontFamily: 'var(--hax-mono)', fontSize: '0.75rem', color: 'var(--hax-ink-muted)', marginTop: '0.5rem' }}>
              Try adjusting or resetting your filter criteria.
            </p>
            <button
              type="button"
              style={{
                marginTop: '1rem',
                fontFamily: 'var(--hax-mono)',
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--hax-ink)',
                background: 'transparent',
                border: '1px solid var(--hax-bc)',
                padding: '6px 12px',
                cursor: 'pointer',
              }}
              onClick={() => setFilterState({ searchQuery: '', selectedAuthor: '', selectedTag: '', sortBy: 'date-desc' })}>
              RESET ALL FILTERS
            </button>
          </div>
        ) : (
          <>
            {visibleItems.length > 0 && <BlogPostItems items={visibleItems} />}
            {additionalMatches.length > 0 && (
              <div className="hax-filter-results" aria-label="Additional matching blog posts">
                {additionalMatches.map((post) => (
                  <article key={post.permalink} className="hax-filter-result">
                    <h2><a href={post.permalink}>{post.title}</a></h2>
                    <p>{post.description}</p>
                    <a href={post.permalink}>READ MORE</a>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {isFiltered ? null : <BlogListPaginator metadata={metadata} />}
      </BlogLayout>
    </HtmlClassNameProvider>
  );
}
