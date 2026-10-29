/**
 * The Dome GitHub Action workflow from dome-backend's
 * packages/action/examples/dome.yml. The action has no release yet, so the
 * pin stays a placeholder until dome-backend tags one.
 */
export const ACTION_WORKFLOW = `# .github/workflows/dome.yml: scan every pull request and push to main.
name: dome
on:
  pull_request:          # never pull_request_target: PR code must not run with write access
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          fetch-depth: 0
          persist-credentials: false
      - uses: dome-security/dome-backend/packages/action@REPLACE_WITH_RELEASE_SHA
        with:
          mode: enforce        # "report" for your first week
`;
