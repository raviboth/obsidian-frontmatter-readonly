#!/usr/bin/env bash
# Build + install Frontmatter Read-Only into an Obsidian vault.
#
# Usage:
#   ./install.sh                    # installs to $HOME/obsidian
#   ./install.sh /path/to/vault     # installs to a specific vault
#
# Copies main.js + manifest.json only — no node_modules, no source files,
# no symlinks. Safe to use with Syncthing / iCloud / etc.
#
# Reload Obsidian (Cmd/Ctrl+R) after running to pick up the new build.

set -euo pipefail

VAULT="${1:-$HOME/obsidian}"
PLUGIN_ID="frontmatter-readonly"
DST="$VAULT/.obsidian/plugins/$PLUGIN_ID"

if [ ! -d "$VAULT/.obsidian" ]; then
	echo "✗ Not a vault: $VAULT (no .obsidian/ folder found)" >&2
	exit 1
fi

cd "$(dirname "$0")"

echo "→ build"
npm run build

echo "→ install → $DST"
mkdir -p "$DST"
cp main.js manifest.json "$DST/"

echo "✓ installed. Reload Obsidian (Cmd/Ctrl+R)."
