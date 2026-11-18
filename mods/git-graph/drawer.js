// Pure helpers for the commit drawer: no herdr imports, so tests can load them.

/** A commit's changed files as a tree, in the order the drawer draws it: each folder's subfolders,
 *  then its files, both by name. A folder holding one subfolder and no files merges with it, as
 *  "src/lib". Each entry is { kind: "folder", name, depth } or { kind: "file", name, depth, file }. */
export function fileTree(files) {
  const root = { dirs: new Map(), files: [] };
  for (const file of files) {
    const parts = file.path.split("/"), name = parts.pop();
    let node = root;
    for (const part of parts) {
      if (!node.dirs.has(part)) node.dirs.set(part, { dirs: new Map(), files: [] });
      node = node.dirs.get(part);
    }
    node.files.push({ name, file });
  }
  const out = [];
  const walk = (node, depth) => {
    for (const [first, start] of [...node.dirs].sort(([a], [b]) => a.localeCompare(b))) {
      let name = first, dir = start;
      while (dir.files.length === 0 && dir.dirs.size === 1) {
        const [[next, child]] = dir.dirs;
        name += `/${next}`; dir = child;
      }
      out.push({ kind: "folder", name, depth });
      walk(dir, depth + 1);
    }
    for (const f of [...node.files].sort((a, b) => a.name.localeCompare(b.name))) out.push({ kind: "file", name: f.name, depth, file: f.file });
  };
  walk(root, 0);
  return out;
}

/** Text broken into lines of at most `width` characters, at spaces where it can be. Blank lines stay. */
export function wrapText(text, width) {
  const max = Math.max(8, Math.floor(width));
  const out = [];
  for (const line of String(text ?? "").split("\n")) {
    let rest = line.replace(/\s+$/, "");
    if (!rest) { out.push(""); continue; }
    while (rest.length > max) {
      const cut = rest.lastIndexOf(" ", max);
      const at = cut > max / 3 ? cut : max;
      out.push(rest.slice(0, at));
      rest = rest.slice(at).replace(/^ /, "");
    }
    out.push(rest);
  }
  return out;
}

/** Shared key for issue linking: { regex, url }, the same for every repository. */
export const ISSUES = "git-graph.issues";

/** Issue linking, as Git Graph does it: a regex and a URL where $1, $2… stand for its groups and
 *  $0 for the whole match. Returns { re, url }, or null when either is empty or the regex is invalid. */
export function issueRule(rule) {
  const pattern = String(rule?.regex ?? "").trim(), url = String(rule?.url ?? "").trim();
  if (!pattern || !/^https?:\/\/\S+$/.test(url)) return null;
  try { return { re: new RegExp(pattern, "g"), url }; } catch { return null; }
}

/** The issue URL for one match: $n is group n, or the whole match when the regex has no such group. */
const issueUrl = (url, m) => url.replace(/\$(\d)/g, (_s, n) => encodeURIComponent(m[Number(n)] ?? m[0]));

/** Text cut into parts at each issue match: { text } or { text, url }. Without a rule, one part. */
export function issueParts(text, rule) {
  text = String(text ?? "");
  if (!rule) return [{ text }];
  const out = [];
  let at = 0;
  rule.re.lastIndex = 0;
  for (const m of text.matchAll(rule.re)) {
    if (!m[0]) continue;
    if (m.index > at) out.push({ text: text.slice(at, m.index) });
    out.push({ text: m[0], url: issueUrl(rule.url, m) });
    at = m.index + m[0].length;
  }
  if (at < text.length || !out.length) out.push({ text: text.slice(at) });
  return out;
}

/** The link at character `col` of the parts, or null. `slack` widens each link by that many characters. */
export function issueAt(parts, col, slack = 0) {
  let at = 0;
  for (const p of parts) {
    const end = at + p.text.length;
    if (p.url && col >= at - slack && col < end + slack) return p.url;
    at = end;
  }
  return null;
}
