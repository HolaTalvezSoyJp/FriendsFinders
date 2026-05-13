#!/usr/bin/env bash
# Builds a static export (out/) suitable for S3 + CloudFront.
#
# Next.js `output: "export"` does not support route handlers under app/api.
# Those handlers are mock backend routes used only in dev. We move them aside
# during the build, then restore them — leaving the working tree unchanged.

set -euo pipefail

cd "$(dirname "$0")/.."

API_DIR="app/api"
DISABLED_DIR="app/_api_disabled_for_build"

restore() {
  if [ -d "$DISABLED_DIR" ]; then
    echo "→ restoring $API_DIR"
    mv "$DISABLED_DIR" "$API_DIR"
  fi
}
trap restore EXIT

if [ -d "$API_DIR" ]; then
  echo "→ moving $API_DIR aside for static build"
  mv "$API_DIR" "$DISABLED_DIR"
fi

echo "→ running next build (BUILD_TARGET=static)"
BUILD_TARGET=static npx next build

echo "✓ static export complete: out/"
