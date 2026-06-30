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

if ! command -v pnpm &>/dev/null; then
  echo "Installing pnpm..."
  npm install -g pnpm
fi

echo "Installing dependencies..."
pnpm install --frozen-lockfile

echo "Building..."
pnpm --filter @envctrl/types build
pnpm --filter @envctrl/cli build

echo "Installing envctrl globally..."
cd apps/cli
TARBALL=$(npm pack --quiet)
npm install -g "$TARBALL"

echo "Done. Run 'envctrl --help' to get started."
