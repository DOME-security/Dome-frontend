#!/usr/bin/env bash
# Repository hygiene checks that lint cannot express. Run in CI and locally:
#   ./scripts/check-hygiene.sh
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
fail=0
error() {
  echo "hygiene: $*" >&2
  fail=1
}

files=$(git ls-files)

# No editor auto-run surfaces in this repo.
if grep -qE '(^|/)\.vscode/' <<<"$files"; then
  error "remove .vscode/ files; this repo must not ship editor tasks or settings"
fi

# No environment files or Stellar identities, except the template.
while IFS= read -r f; do
  case "$f" in
    .env.example) ;;
    .env | .env.* | */.env | */.env.*) error "do not commit environment files: $f" ;;
    .stellar/* | */identity/*.toml) error "do not commit Stellar identities: $f" ;;
  esac
done <<<"$files"

# No install-time scripts in package.json.
if node -e 'const s=require("./package.json").scripts||{};process.exit(["preinstall","install","postinstall","prepare","prepublish"].some(k=>k in s)?0:1)'; then
  error "package.json must not define install lifecycle scripts"
fi

# Workflows: pull_request only, actions pinned to a full commit SHA.
for wf in .github/workflows/*.yml; do
  [ -e "$wf" ] || continue
  if grep -qE '^\s*pull_request_target\s*:' "$wf"; then
    error "$wf uses pull_request_target"
  fi
  while IFS= read -r line; do
    ref=${line#*@}
    ref=${ref%% *}
    if ! [[ $ref =~ ^[0-9a-f]{40}$ ]]; then
      error "$wf: action not pinned to a commit SHA: ${line#*uses: }"
    fi
  done < <(grep -E '^\s*-?\s*uses:\s*[^.]' "$wf" | grep -v 'uses: \./' || true)
done

if [ "$fail" -ne 0 ]; then
  exit 1
fi
echo "hygiene: ok"
