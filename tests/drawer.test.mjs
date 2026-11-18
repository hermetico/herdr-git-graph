// The commit drawer's file tree and line wrapping. Run: node tests/drawer.test.mjs
import assert from "node:assert/strict";
import { fileTree, issueAt, issueParts, issueRule, wrapText } from "../mods/git-graph/drawer.js";

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
// Issue linking
const jira = issueRule({ regex: "(AIRE-\\d+)", url: "https://example.atlassian.net/browse/$1" });
assert.deepEqual(issueParts("AIRE-525 The exterior, see AIRE-9", jira), [
  { text: "AIRE-525", url: "https://example.atlassian.net/browse/AIRE-525" },
  { text: " The exterior, see " },
  { text: "AIRE-9", url: "https://example.atlassian.net/browse/AIRE-9" },
]);
assert.deepEqual(issueParts("no issue here", jira), [{ text: "no issue here" }]);
assert.deepEqual(issueParts("x", null), [{ text: "x" }]);
assert.equal(issueRule({ regex: "(", url: "https://x.y/$1" }), null);
assert.equal(issueRule({ regex: "a", url: "javascript:alert(1)" }), null);
assert.equal(issueRule({ regex: "", url: "https://x.y/$1" }), null);
// No group: $1 falls back to the whole match.
assert.equal(issueParts("#12", issueRule({ regex: "#\\d+", url: "https://x.y/$1" }))[0].url, "https://x.y/%2312");
const parts = issueParts("fix AIRE-1 now", jira);
assert.equal(issueAt(parts, 5), "https://example.atlassian.net/browse/AIRE-1");
assert.equal(issueAt(parts, 1), null);
assert.equal(issueAt(parts, 10, 1), "https://example.atlassian.net/browse/AIRE-1");
console.log("drawer ok");
