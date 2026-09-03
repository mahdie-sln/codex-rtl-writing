# Security policy

## Threat model

Unicode bidirectional controls can reorder visible text without changing its underlying character order. Inside source code or machine-readable data, this can conceal malicious or misleading content (often called a Trojan Source issue).

This skill therefore treats display prose and machine content as separate trust domains.

## Allowed behavior

Generated conversational prose may use only these controls:

- `U+200F RIGHT-TO-LEFT MARK` to make a `dir=auto` block align right.
- `U+2067 RIGHT-TO-LEFT ISOLATE` to isolate a Persian prose block.
- `U+2066 LEFT-TO-RIGHT ISOLATE` to isolate an embedded LTR run.
- `U+2069 POP DIRECTIONAL ISOLATE` to close either isolate.

Every isolate must be balanced. Directional embedding and override characters `U+202A` through `U+202E` are forbidden.

## Prohibited locations

No bidi control may be inserted into source code, commands, file paths, URLs, filenames, identifiers, configuration, structured data, logs, terminal output, diffs, patches, quoted tool output, or any other exact-copy payload.

The repository itself intentionally contains no literal bidi control characters. All controls are named by code point so reviews and diffs remain transparent. Run `node validate.mjs` before publishing or releasing.

## Operational scope

The skill has no runtime dependencies and does not request network, filesystem, account, credential, or application access. It only guides response formatting.

## Reporting a vulnerability

After this repository is published, use GitHub private vulnerability reporting when available. Otherwise, open a minimal issue that contains no sensitive exploit details and ask the maintainer for a private contact channel.

Do not include secrets, credentials, private conversation content, or weaponized examples in a public report.
