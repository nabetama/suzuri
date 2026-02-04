const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function parseFrontmatter(raw: string): {
  frontmatter: string | null;
  body: string;
} {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    return { frontmatter: null, body: raw };
  }
  const frontmatter = match[0];
  const body = raw.slice(frontmatter.length);
  return { frontmatter, body };
}

export function serializeFrontmatter(
  frontmatter: string | null,
  body: string,
): string {
  if (!frontmatter) return body;
  return frontmatter + body;
}
