#!/usr/bin/env bash
# Changesets runs `npm publish <dir> --tag <tag> --json`.
# This stands in front of npm and turns that into `npm stage publish`,
# so a release waits for a maintainer to approve it with 2FA.
set -euo pipefail

real="${NGATOMS_REAL_NPM:?NGATOMS_REAL_NPM must point at the real npm binary}"

if [[ "${1:-}" != "publish" ]]; then
  exec "$real" "$@"
fi
shift

args=()
for arg in "$@"; do
  if [[ "$arg" != "--json" ]]; then
    args+=("$arg")
  fi
done

exec "$real" stage publish "${args[@]}"
