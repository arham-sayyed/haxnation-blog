/**
 * Swizzled BlogAuthorsListPage — styled author cards (no external link).
 */
import React from 'react';
import clsx from 'clsx';
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import { translateBlogAuthorsListPageTitle } from '@docusaurus/theme-common/internal';
import BlogLayout from '@theme/BlogLayout';
import SearchMetadata from '@theme/SearchMetadata';
import Heading from '@theme/Heading';
import Author from '@theme/Blog/Components/Author';

function AuthorListItem({ author }) {
  return (
    <li className="hax-author-list-item">
      <div className="hax-author-list-item__main">
        <Author as="h2" author={author} count={author.count} />
      </div>
    </li>
  );
}

function AuthorsList({ authors }) {
  return (
    <section className="hax-authors-list-section">
      <ul className="hax-authors-list">
        {authors.map((author) => (
          <AuthorListItem key={author.key} author={author} />
        ))}
      </ul>
    </section>
  );
}

export default function BlogAuthorsListPage({ authors, sidebar }) {
  const title = translateBlogAuthorsListPageTitle();
  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogAuthorsListPage,
      )}>
      <PageMetadata title={title} />
      <SearchMetadata tag="blog_authors_list" />
      <BlogLayout sidebar={sidebar}>
        <Heading as="h1">{title}</Heading>
        <AuthorsList authors={authors} />
      </BlogLayout>
    </HtmlClassNameProvider>
  );
}
