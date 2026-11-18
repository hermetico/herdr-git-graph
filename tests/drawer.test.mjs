// The commit drawer's file tree and line wrapping. Run: node tests/drawer.test.mjs
import assert from "node:assert/strict";
import { fileTree, wrapText } from "../mods/git-graph/drawer.js";

const f = (path) => ({ path, status: "M", add: 1, del: 1 });
const tree = fileTree([f("CHANGELOG.md"), f("weights/config.cfg"), f("enhancer/__init__.py"), f("src/lib/a.js"), f("src/lib/b.js")]);
assert.deepEqual(tree.map((e) => `${"  ".repeat(e.depth)}${e.kind === "folder" ? e.name + "/" : e.name}`), [
  "enhancer/", "  __init__.py", "src/lib/", "  a.js", "  b.js", "weights/", "  config.cfg", "CHANGELOG.md",
]);
assert.equal(tree.find((e) => e.name === "a.js").file.path, "src/lib/a.js");
// A folder with a file of its own doesn't merge with its subfolder.
assert.deepEqual(fileTree([f("a/x.js"), f("a/b/y.js")]).map((e) => e.name), ["a", "b", "y.js", "x.js"]);
assert.deepEqual(fileTree([]), []);

assert.deepEqual(wrapText("one two three four", 9), ["one two", "three", "four"]);
assert.deepEqual(wrapText("a\n\nb", 20), ["a", "", "b"]);
assert.deepEqual(wrapText("abcdefghijklmnopqrst", 8), ["abcdefgh", "ijklmnop", "qrst"]);
console.log("drawer ok");
