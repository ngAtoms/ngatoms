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

lock="${NGATOMS_STAGE_LOCK:-${RUNNER_TEMP:-/tmp}/ngatoms-npm-stage.lock}"
mkdir -p "$(dirname "$lock")"
exec 9>"$lock"
flock 9

set +e
output="$("$real" stage publish "${args[@]}" 2>&1)"
code=$?
set -e
printf '%s\n' "$output"
if [[ "$code" -eq 0 ]]; then
  exit 0
fi
# A rerun finds the version already waiting for approval. Rejecting it needs 2FA.
if [[ "$output" == *"Cannot stage previously published version"* || "$output" == *"previously staged version"* ]]; then
  echo "ngatoms: this version is already staged; leaving it for approval"
  exit 0
fi
exit "$code"
