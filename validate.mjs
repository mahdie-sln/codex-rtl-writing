import { lstat, readFile, readdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const failures = [];

const requiredFiles = [
  "SKILL.md",
  "agents/openai.yaml",
  "README.md",
  "SECURITY.md",
  "LICENSE",
];

const forbiddenCodePoints = new Set([
  0x061c,
  0x200e,
  0x200f,
  0x202a,
  0x202b,
  0x202c,
  0x202d,
  0x202e,
  0x2066,
  0x2067,
  0x2068,
  0x2069,
]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === ".git") continue;
    const path = join(directory, entry.name);
    const metadata = await lstat(path);

    if (metadata.isSymbolicLink()) {
      failures.push(`Symlink is not allowed: ${relative(root, path)}`);
      continue;
    }

    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (entry.isFile()) files.push(path);
  }

  return files;
}

for (const file of requiredFiles) {
  try {
    await lstat(join(root, file));
  } catch {
    failures.push(`Required file is missing: ${file}`);
  }
}

const files = await walk(root);

for (const file of files) {
  const bytes = await readFile(file);
  if (bytes.includes(0)) continue;

  const text = bytes.toString("utf8");
  if (text.charCodeAt(0) === 0xfeff) {
    failures.push(`UTF-8 BOM is not allowed: ${relative(root, file)}`);
  }

  for (const char of text) {
    if (forbiddenCodePoints.has(char.codePointAt(0))) {
      failures.push(
        `Literal bidi control U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")} in ${relative(root, file)}`,
      );
    }
  }
}

const skill = await readFile(join(root, "SKILL.md"), "utf8");
if (!skill.startsWith("---\n")) failures.push("SKILL.md must start with YAML frontmatter.");
if (!/\nname: ["']?codex-rtl-writing["']?\n/.test(skill)) {
  failures.push("SKILL.md has an invalid or missing skill name.");
}
if (!/\ndescription: .+\n/.test(skill)) failures.push("SKILL.md is missing its description.");

const ui = await readFile(join(root, "agents/openai.yaml"), "utf8");
if (!ui.includes('display_name: "Codex RTL Writing"')) {
  failures.push("agents/openai.yaml has an unexpected display name.");
}
if (!ui.includes("allow_implicit_invocation: true")) {
  failures.push("Implicit invocation policy is missing.");
}

if (failures.length) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exit(1);
}

console.log(`OK: validated ${files.length} files; no literal bidi controls or symlinks found.`);
