# Frontmatter Read-Only

Mark an Obsidian note read-only by adding a property to its frontmatter.

```yaml
---
readonly: true
---

# This note is read-only.
# You can scroll, search, copy. You can't edit.
```

Remove the property (or set it to anything other than `true`) to make the note editable again.

## Why

Some notes are reference material — config, dashboards, snapshots, ingestion output, state mirrors — that you don't want to fat-finger an edit into. Obsidian's vault-wide "Read-only mode" is too coarse. This plugin makes read-only a property of the **note itself**: travels with the file, persists across sessions, easy to toggle.

This plugin does not encrypt or protect against external editors. It only blocks edits inside Obsidian. For OS-level locks, use `chmod 444`. For encryption, see *Protected Note* or *Password Protection*.

## How it works

- On file open / frontmatter change, the plugin checks for the configured property (default: `readonly`).
- If set to `true`, the underlying CodeMirror editor's `editable` flag is flipped off via a compartment. The view still renders, you can scroll, search, and copy — you just can't type.
- If unset or `false`, the editor behaves normally.

## Entry points

You can toggle a note's read-only state five ways:

1. **Edit the frontmatter directly** — add or remove `readonly: true`.
2. **Command palette** → "Toggle read-only on current note".
3. **File explorer right-click** → "Make read-only" / "Make editable".
4. **Editor right-click** → "Make read-only" / "Make editable".
5. **Status bar** — when the active note is read-only, a 🔒 indicator appears. Click it to make the note editable.

All entry points edit the frontmatter for you (using Obsidian's `processFrontMatter` API) and show a notice.

## Settings

- **Frontmatter property name** — defaults to `readonly`. Change it if `readonly` collides with another plugin or your own convention. Notes then use `<your-property>: true`.

## Install (manual / BRAT)

**BRAT:**
1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin.
2. Command palette → "BRAT: Add a beta plugin for testing" → paste `raviboth/obsidian-frontmatter-readonly`.
3. Enable **Frontmatter Read-Only** in Community Plugins settings.

**Manual:**
1. Download `main.js` and `manifest.json` from the latest [release](../../releases).
2. Drop into `<vault>/.obsidian/plugins/frontmatter-readonly/`.
3. Reload Obsidian, enable in settings.

## Scope (and what this is not)

- ✅ Prevents accidental edits inside Obsidian.
- ✅ Persists across restart (the property lives in the file, not plugin storage).
- ✅ Works in source mode and live preview.
- ❌ Does **not** prevent edits from outside Obsidian (vim, VS Code, sync clients, mobile file managers). Use `chmod 444` for that.
- ❌ Does **not** encrypt — content is still plain markdown on disk.
- ❌ Does **not** lock the frontmatter itself — anyone (including you) can remove `readonly: true` to re-enable editing.

## Develop

```bash
npm install
npm run dev   # watch build → main.js
```

### Install into a vault

Use the bundled `install.sh` — it builds, then copies `main.js` + `manifest.json` into a vault's plugin folder. Runtime-only, no source clutter:

```bash
./install.sh                    # installs to $HOME/obsidian
./install.sh /path/to/vault     # installs to a specific vault
```

> ⚠ Don't symlink the repo into a synced vault (Syncthing, iCloud, etc.). The sync agent will resolve the symlink and propagate `node_modules/` + source files across machines, which can hang or break Obsidian on the other end. The runtime-only copy from `install.sh` is safe.

## License

MIT — see [LICENSE](LICENSE).
