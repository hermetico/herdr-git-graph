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
