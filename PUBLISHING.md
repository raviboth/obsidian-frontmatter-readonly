# Publishing — community directory tracker

Track work for getting **Frontmatter Read-Only** listed in Obsidian's official community plugins directory.

Reference: <https://docs.obsidian.md/Plugins/Releasing/Submission+requirements+for+plugins>

---

## Phase 1 — Repo prep

- [x] Public GitHub repo: `obsidian-frontmatter-readonly`
- [x] MIT license file present
- [x] `manifest.json` w/ required fields (`id`, `name`, `version`, `minAppVersion`, `description`, `author`, `authorUrl`, `isDesktopOnly`)
- [x] `versions.json` mapping plugin version → minAppVersion
- [x] `README.md` w/ install steps, usage, scope, entry points
- [x] `.gitignore` excludes `node_modules/`, `main.js`, `data.json`
- [x] Build chain: TypeScript + esbuild
- [x] Plugin id (`frontmatter-readonly`) does NOT start with `obsidian-`
- [x] Property name configurable via settings (default: `readonly`)
- [x] Multiple toggle entry points: command, file menu, editor menu, status bar
- [ ] `gh repo create raviboth/obsidian-frontmatter-readonly --public --source=. --remote=origin --push`
- [ ] Push initial commit

## Phase 2 — Build + smoke test

- [ ] `npm install`
- [ ] `npm run build` produces `main.js` w/o errors
- [ ] Symlink into test vault: `ln -s ~/repos/obsidian-frontmatter-readonly ~/obsidian-test-vault/.obsidian/plugins/frontmatter-readonly`
- [ ] Enable plugin in test vault
- [ ] Verify: `readonly: true` in frontmatter blocks edits in source mode
- [ ] Verify: `readonly: true` blocks edits in live preview
- [ ] Verify: removing `readonly: true` re-enables editing
- [ ] Verify: command "Toggle read-only on current note" toggles property
- [ ] Verify: file explorer right-click "Make read-only" works
- [ ] Verify: editor right-click "Make read-only" works
- [ ] Verify: status bar shows 🔒 when active note is read-only; click toggles
- [ ] Verify: state persists across Obsidian restart
- [ ] Verify: settings — changing property name takes effect after save
- [ ] Verify: settings — custom property name (e.g. `frozen`) works end-to-end
- [ ] Edge case: file w/ no frontmatter — editable
- [ ] Edge case: file w/ `readonly: false` — editable
- [ ] Edge case: file w/ `readonly: yes` — currently treated as NOT read-only (strict `=== true`). Document or relax.
- [ ] Edge case: multiple panes w/ same readonly file — all panes blocked
- [ ] Edge case: split view, readonly on one side, editable on other — independent state
- [ ] Edge case: non-md file (canvas, pdf) — no menu items appear
- [ ] Mobile smoke test (or flip `isDesktopOnly: true` if untested)

## Phase 3 — Beta distribution (BRAT)

- [ ] Tag first release: `git tag 0.1.0 && git push --tags`
- [ ] Create GitHub release tagged `0.1.0` — attach `main.js`, `manifest.json` as release assets (NOT a zip)
- [ ] Test BRAT install: command palette → "BRAT: Add a beta plugin" → `raviboth/obsidian-frontmatter-readonly`
- [ ] Post in Obsidian Discord `#plugin-dev` or `#share` channel for feedback
- [ ] Post in Obsidian Forum → Share & Showcase
- [ ] Iterate on feedback for ~1–2 weeks

## Phase 4 — Community directory submission

- [x] Plugin id (`frontmatter-readonly`) does NOT start with `obsidian-`
- [ ] Plugin id is unique vs existing entries in `community-plugins.json` (verify before PR)
- [x] No telemetry, no network calls, no `eval()`, no remote code, no auto-update
- [ ] Mobile support declared correctly (`isDesktopOnly` accurate) — currently `false`, untested
- [ ] `manifest.json` version matches GitHub release tag
- [ ] Release assets in repo root (`main.js`, `manifest.json`) — NOT zipped
- [x] README explains what / why / install / usage / limits
- [x] TypeScript, no `var`, consistent naming
- [ ] Run [obsidian-plugin-validator](https://github.com/obsidianmd/plugin-review-bot) or equivalent linter
- [ ] Fork [`obsidianmd/obsidian-releases`](https://github.com/obsidianmd/obsidian-releases)
- [ ] Edit `community-plugins.json` — add entry:
  ```json
  {
    "id": "frontmatter-readonly",
    "name": "Frontmatter Read-Only",
    "author": "Ravi Both",
    "description": "Mark a note read-only by adding `readonly: true` to its frontmatter.",
    "repo": "raviboth/obsidian-frontmatter-readonly"
  }
  ```
- [ ] Open PR. Title pattern: `Add plugin: Frontmatter Read-Only`
- [ ] Respond to review feedback (bot + human). Queue is weeks–months.
- [ ] Once merged: plugin appears in Obsidian's "Browse" plugin list within ~24h.

## Phase 5 — Post-launch

- [ ] Add screenshots / GIF to README (toggle in action, status bar, settings)
- [ ] Add CHANGELOG.md
- [ ] Set up GitHub Actions to auto-build + release on tag push
- [ ] Monitor issues / PRs
- [ ] Plan v0.2.0 — possible additions:
  - Custom status bar text (configurable label/icon)
  - File explorer icon decoration for read-only notes
  - Folder-level default (e.g. everything in `_garmin/` is read-only)
  - Accept truthy values (`yes`, `1`) — currently strict `=== true`
  - Lock the frontmatter property itself (prevent edits to the read-only line in source mode)

---

## Known risks (for reviewer transparency)

### Private API: `(view.editor as any).cm`

To dispatch a `Compartment.reconfigure(EditorView.editable.of(false))`, the plugin needs an `EditorView` reference. Obsidian's `MarkdownView.editor` is publicly typed as `Editor`, which does not expose the CM6 `EditorView`. We access it via `(view.editor as unknown as { cm: EditorView }).cm`.

This is the same pattern used by widely-published plugins including:
- **Note Locker** (Felvesthe)
- **Obsidian Outliner** (in community directory)
- **Linter** (in community directory)
- Dozens of others

It is de-facto stable but technically internal. If Obsidian ever exposes an official `setReadOnly` on `Editor`, we should migrate.

**Officially-exposed alternatives considered (and why we did not use them):**

| Approach | Public? | Tradeoff |
|---|---|---|
| `view.setState({ mode: 'preview' })` | ✅ public | Forces reading view. Hides source mode entirely. User can manually flip back via the eye/pencil icon — we'd have to re-force, fighting the UI. More aggressive UX. (Note Locker uses this approach.) |
| `registerEditorExtension` w/o dispatch | ✅ public | Only sets default editor state at creation time. Can't react to frontmatter changes for already-open editors. Insufficient. |
| `EditorView.editable.of(false)` static extension | ✅ public | Would lock *every* editor — not per-file. |
| Compartment + dispatch via `view.editor.cm` | ❌ private cast | What we use. Subtle UX (source mode still visible, just non-editable). |

We chose the compartment approach for the better UX. If directory review rejects, fallback plan: switch to `view.setState({ mode: 'preview' })` on read-only files + listener that re-forces preview on user mode-toggle.

### Strict truthy check

Currently `frontmatter[propertyName] === true` only. YAML `yes`/`no` parse to boolean so `readonly: yes` works in Obsidian's YAML parser. `readonly: 1` does not. README + settings description document the strict-`true` expectation. Relaxing to truthy would also catch `readonly: false` if not handled carefully.

---

## Notes

- Community directory review: read past rejections in [obsidian-releases PRs](https://github.com/obsidianmd/obsidian-releases/pulls?q=is%3Apr+is%3Aclosed+label%3Aplugin) for common failure modes.
- BRAT is the recommended distribution channel while waiting for directory review. Don't block on the directory.
- Repo name `obsidian-frontmatter-readonly` follows community convention (prefix for discoverability); plugin id `frontmatter-readonly` follows submission rules (no `obsidian-` prefix).
