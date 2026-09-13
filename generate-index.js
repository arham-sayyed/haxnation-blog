const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const blogDir = path.join(__dirname, 'blog');
const outputFile = path.join(__dirname, 'static', 'blog-index.json');

function findBlogFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findBlogFiles(entryPath);
    return /\.mdx?$/.test(entry.name) ? [entryPath] : [];
  });
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function toSlug(filePath, frontMatter) {
  if (frontMatter.slug) return frontMatter.slug.replace(/^\/+|\/+$/g, '');

  const relativePath = path.relative(blogDir, filePath).replace(/\\/g, '/');
  const fileName = path.basename(relativePath).replace(/\.mdx?$/, '');
  const dateMatch = fileName.match(/^(\d{4})-(\d{1,2})-(\d{1,2})-(.+)$/);
  const directory = path.dirname(relativePath).replace(/^\.$/, '');

  if (!dateMatch) return [directory, fileName].filter(Boolean).join('/');
  return [dateMatch[1], dateMatch[2].padStart(2, '0'), dateMatch[3].padStart(2, '0'), directory, dateMatch[4]]
    .filter(Boolean)
    .join('/');
}

function getDate(frontMatter, filePath) {
  if (frontMatter.date) return new Date(frontMatter.date).toISOString();
  const fileDate = path.basename(filePath).match(/^(\d{4}-\d{1,2}-\d{1,2})-/);
  return fileDate ? new Date(fileDate[1]).toISOString() : null;
}

const posts = findBlogFiles(blogDir).map((filePath) => {
  const source = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(source);
  const frontMatter = parsed.data;
  const body = parsed.content.replace(/[`*_>#-]/g, ' ').replace(/\s+/g, ' ').trim();
  const authors = asArray(frontMatter.authors).map((author) =>
    typeof author === 'string' ? author : author.name
  ).filter(Boolean);
  const tags = asArray(frontMatter.tags).map((tag) =>
    typeof tag === 'string' ? tag : tag.label
  ).filter(Boolean);

  return {
    title: String(frontMatter.title || path.basename(filePath)),
    description: String(frontMatter.description || frontMatter.summary || ''),
    content: body,
    authors,
    tags,
    date: getDate(frontMatter, filePath),
    url: `/blog/${toSlug(filePath, frontMatter)}`,
  };
}).sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0));

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, `${JSON.stringify(posts)}\n`);
console.log(`Global blog search index generated: ${posts.length} posts`);
