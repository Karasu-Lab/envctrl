#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/Karasu-Lab/envctrl.git"
TMP_DIR=$(mktemp -d)

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

echo "Cloning envctrl..."
git clone --depth 1 "$REPO_URL" "$TMP_DIR"

cd "$TMP_DIR"

echo "Building..."
if command -v pnpm &>/dev/null; then
  pnpm install --frozen-lockfile
  pnpm --filter @envctrl/types build
  pnpm --filter @envctrl/cli build
else
  (cd packages/types && npm install && npm run build)

  node -e "
    const fs = require('fs');
    const p = 'apps/cli/package.json';
    const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
    pkg.devDependencies['@envctrl/types'] = 'file:../../packages/types';
    fs.writeFileSync(p, JSON.stringify(pkg, null, 2));
  "

  (cd apps/cli && npm install && npm run build)
fi

echo "Installing envctrl globally..."
cd apps/cli
TARBALL=$(npm pack --quiet)
npm install -g "$TARBALL"

echo "Done. Run 'envctrl --help' to get started."
