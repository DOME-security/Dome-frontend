// English text for the whole app. Every user-facing string lives here (rule
// titles and reasons come from src/vendor/rules.json). A translation is a new
// file with the same shape: `export const fr: Messages = { ... }`.
//
// Values that need data are functions, so word order can change per language.
// Some strings use the guide Markdown subset (`code`, [link](https://…)) and
// are rendered with <InlineNodes nodes={parseInline(…)} />, never as HTML.

const network = { testnet: 'Stellar testnet', mainnet: 'Stellar mainnet' } as const;

export const en = {
  app: {
    title: 'Dome: check before you open',
    titleSuffix: (page: string) => `${page} · Dome`,
    skipLink: 'Skip to content',
    brand: 'Dome',
    navLabel: 'Main',
    nav: {
      checkRepo: 'Check a repo',
      checkFile: 'Check a file',
      registry: 'Registry',
      infected: 'Infected?',
      dashboard: 'Maintainers',
    },
    themeLabel: 'Colour theme',
    theme: { system: 'System', light: 'Light', dark: 'Dark' },
    footerNotice: 'Dome looks for known auto-run and payload patterns; it cannot prove code is safe.',
    footerNetwork: (label: string) => `Registry on ${label}`,
    footerLinks: {
      hardening: 'Hardening guide',
      wave: 'Stellar Wave guide',
      curate: 'Curator console',
      source: 'Source on GitHub',
    },
    loading: 'Loading…',
    genericError: 'Something went wrong. Try again in a moment.',
  },

  honestyNotice: 'No known pattern found is not the same as safe.',

  severity: {
    block: { label: 'Block', icon: '🔴', description: 'Do not open, install or run this until it has been reviewed.' },
    review: {
      label: 'Review',
      icon: '🟠',
      description: 'Read this before opening the folder in your editor or running anything.',
    },
    info: { label: 'Info', icon: '⚪', description: 'Worth knowing; not a problem on its own.' },
  },

  verdict: {
    block: {
      label: 'Blocked',
      summary:
        'Dome found code that runs when you open, install or build this repository and matches a known attack pattern. Do not open it in your editor.',
    },
    review: {
      label: 'Needs review',
      summary: 'Dome found code that can run automatically. Read the findings before you open the folder or run anything.',
    },
    clean: {
      label: 'No known pattern found',
      summary: 'Dome did not find any known auto-run or payload pattern at this commit.',
    },
    incomplete: {
      label: 'Incomplete',
      summary: 'Dome could not read every file, so this result is not complete. Treat it as needing review.',
    },
    unreadable: 'Unreadable',
  },

  incomplete: {
    'too-large': 'Too large to read',
    'read-error': 'Could not be read',
    'invalid-config': 'Configuration could not be parsed',
    'unsupported-entry': 'Unsupported file type',
  } as Record<string, string>,

  unknownRule: {
    id: 'unknown rule',
    title: 'A rule this version of the app does not know yet',
    summary: 'Reload the page to get the latest app, or check the rule in the Dome documentation.',
  },

  apiErrors: {
    unreachable: 'Could not reach the Dome API. Check your connection and try again.',
    unexpected: (what: string) => `Unexpected response from the Dome API (${what}).`,
    notSha256: 'That is not a SHA-256 hash.',
    status400: 'The Dome API could not accept that request. Check the link and try again.',
    status404: 'Not found.',
    status429: 'Too many requests. Wait a minute and try again.',
    status5xx: 'The Dome API is having trouble. Try again in a few minutes.',
    other: (status: number) => `The Dome API returned an error (${status}).`,
  },

  fileTooLarge: (sizeMb: string, maxMb: number) =>
    `This file is ${sizeMb} MB. Dome can check files up to ${maxMb} MB in the browser. Payloads are usually small: check the repository it came from instead.`,

  network,

  indicatorKind: {
    hash: 'File fingerprint',
    marker: 'Campaign marker',
    domain: 'Staging or C2 domain',
    task: 'Editor task file',
    font: 'Fake font file',
    config: 'Build config file',
    script: 'Script',
    package: 'npm package',
  } as Record<string, string>,
  indicatorKindOther: 'Other',

  contractErrors: {
    1: 'The approval threshold is too low.',
    2: 'That address already has this role.',
    3: 'That address does not have this role.',
    4: 'This account is not a registered attester.',
    5: 'The verdict is not one the registry accepts.',
    6: 'The commit id is not a valid git commit.',
    7: 'The scanner version is missing.',
    8: 'The page size is out of range.',
    9: 'This account is not a registered curator.',
    10: 'The indicator kind is not one the registry accepts.',
    11: 'An indicator with this hash already exists (retracted ones included).',
    12: 'There is no indicator with this hash.',
    13: 'You have already approved this indicator.',
    14: 'This indicator has been retracted and can no longer change.',
    15: 'There is no attestation at that position for this repository.',
    16: 'This attestation has already been retracted.',
    17: 'Only the original attester or the admin can retract this attestation.',
  } as Record<number, string>,
  contractErrorOther: (code: number) => `The registry rejected the transaction (error ${code}).`,

  ledger: {
    checking: (subject: string, net: string) => `Checking ${subject} against the ${net} ledger…`,
    match: (subject: string, net: string) => `Verified: ${subject} matches the ${net} ledger.`,
    mismatch: (net: string) => `The ${net} ledger disagrees with the Dome API.`,
    mismatchAdvice: 'Trust the ledger, and treat this page with suspicion until it is fixed.',
    unavailable: (subject: string) => `Could not reach Stellar to verify ${subject}. What you see comes from the Dome API only.`,
    notConfigured: 'Ledger verification is not configured for this build.',
    diff: {
      noIndicator: 'The ledger has no indicator with this fingerprint.',
      indicatorStatus: (status: string) => `The ledger says this indicator is ${status}, not active.`,
      indicatorUnlisted: 'The ledger says this indicator is active, but the Dome API does not list it.',
      campaign: 'The campaign label differs from the ledger.',
      noAttestation: 'The ledger has no attestation for this repository.',
      extraAttestation: 'The ledger has an attestation the Dome API does not show.',
      retracted: 'The ledger says this attestation was retracted.',
      commit: 'The commit differs from the ledger.',
      verdict: 'The verdict differs from the ledger.',
      reportHash: 'The report hash differs from the ledger.',
      notActive: (hashPrefix: string) => `${hashPrefix}… is not active on the ledger.`,
    },
  },

  report: {
    caption: 'Findings, most serious first',
    columns: { level: 'Level', what: 'What Dome found', where: 'Where' },
    wholeRepo: 'Whole repository',
    whyItMatters: 'Why this matters',
    noFindings: 'No findings.',
    ignored: (n: number) =>
      `${n} ${n === 1 ? 'finding was' : 'findings were'} in test fixtures or allowed by the repository's hash-pinned Dome config, and did not affect the verdict.`,
    unreadable: (n: number) => `${n} ${n === 1 ? 'file' : 'files'} could not be read`,
    stats: (scope: 'full' | 'diff', inScope: number, inTree: number, rules: number, version: string) =>
      `${scope === 'diff' ? 'Changes scanned' : 'Full repository scanned'}: ${inScope} of ${inTree} files, ${rules} rules, Dome ${version}.`,
  },

  scanProgress: {
    queued: 'Queued',
    running: 'Scanning (Dome reads files; it never runs them)',
    done: 'Report ready',
    queuedAnnouncement: 'Scan queued.',
    runningAnnouncement: 'Scan running.',
  },

  home: {
    heading: 'Check a repo before you open it.',
    lead: 'Some repositories run code the moment you open the folder, install dependencies or start a build. Dome shows you what a repo would run and whether it matches a known attack, with nothing to install.',
    checkRepo: 'Check a GitHub repo',
    checkFile: 'Check a single file',
    safeHeading: 'Three things that keep you safe',
    steps: [
      {
        title: 'Check before you open',
        body: 'Opening a folder in VS Code or Cursor can run code before you read a single line. Paste the link here first.',
      },
      {
        title: 'Keep automatic tasks off',
        body: 'Leave Workspace Trust on and set task.allowAutomaticTasks to off, so nothing runs just because you opened a folder.',
      },
      {
        title: 'Never install from an unknown repo on a machine with keys',
        body: 'npm install runs scripts. Do it in a container or a throwaway machine, never next to your wallet or SSH keys.',
      },
    ],
    moreHeading: 'More from Dome',
    more: [
      { to: '/guides/infected', link: 'I think I was infected', text: 'what to do, in order, starting now.' },
      {
        to: '/guides/hardening',
        link: 'Harden your editor and repo',
        text: 'settings and repo rules that stop auto-run attacks.',
      },
      {
        to: '/registry',
        link: 'Browse the Dome Registry',
        text: 'known-bad files, approved by curators and recorded on Stellar.',
      },
      { to: '/guides/wave', link: 'Stellar Wave review routine', text: 'for maintainers and contributors during a Wave.' },
    ],
  },

  notFound: {
    title: 'Page not found',
    body: 'That page does not exist.',
    home: 'home page',
    checkRepo: 'check a repo',
    goBackBefore: 'Go back to the',
    or: 'or',
    errorTitle: 'Something went wrong',
    errorBody: 'The page failed to load. Reload to try again; if it keeps happening, the app may have been updated.',
    errorHome: 'Go to the home page',
    errorPageTitle: 'Error',
  },

  guides: {
    toc: 'On this page',
  },

  checkRepo: {
    title: 'Check a repo',
    lead: 'Paste a public GitHub link. Dome reads the repository on its servers, without running anything, and shows what would run when you open, install or build it.',
    urlLabel: 'GitHub repository',
    urlPlaceholder: 'https://github.com/owner/repo',
    refLabel: 'Branch or tag',
    optional: '(optional)',
    submit: 'Check',
    submitting: 'Starting…',
    invalidUrl: 'Enter a public GitHub repository, like https://github.com/owner/repo.',
    invalidRef: 'That branch or tag name is not valid.',
    loadingScan: 'Loading scan…',
    commit: 'Commit',
    defaultBranch: 'Default branch',
    on: 'on',
    failed: 'The scan could not finish.',
    failedAdvice: 'This is not a clean result. Try again later, and do not open the repository until a scan completes.',
    slow: 'This scan is taking longer than usual. It is still not a result: do not open the repository yet.',
    checkAgain: 'Check again',
    history: 'Repository history and on-chain attestation',
  },

  checkFile: {
    title: 'Check a file',
    leadBefore: 'Got a suspicious ',
    leadAfter:
      ', font or config file? Dome computes its fingerprint in your browser and checks it against files confirmed as malicious. The file is never uploaded.',
    choose: 'Choose a file',
    orDrop: 'or drop it here',
    dropHint: (maxMb: number) => `Up to ${maxMb} MB. The file stays on your device; only its SHA-256 fingerprint is looked up.`,
    hashing: 'Computing the fingerprint on your device…',
    havePasted: 'Already have a SHA-256 fingerprint?',
    hashLabel: 'SHA-256',
    lookUp: 'Look up',
    invalidHash: 'A SHA-256 fingerprint is 64 characters, 0-9 and a-f.',
    fileLabel: 'File',
    lookingUp: 'Looking up the fingerprint…',
    resultLabel: 'Result',
    knownBad: "This exact file is on the Dome Registry's known-bad list.",
    knownBadAdvice: 'Do not open or run it. If it came from a repository you opened, follow',
    campaign: 'Campaign',
    evidence: 'Evidence',
    recorded: 'Recorded on chain',
    ledger: (n: number) => `Ledger ${n}`,
    viewTx: 'View transaction',
    details: 'Indicator details',
    notListed: 'Not on the known-bad list',
    notListedBody:
      'This exact file has not been recorded as malicious. A file can still be harmful if it is new or slightly changed, so check the repository it came from as well.',
    checkRepo: 'Check the repository',
    size: (bytes: number) =>
      bytes < 1024
        ? `${bytes} bytes`
        : bytes < 1024 * 1024
          ? `${(bytes / 1024).toFixed(1)} KB`
          : `${(bytes / 1024 / 1024).toFixed(1)} MB`,
    evidenceNone: 'None published',
    hashFromFile: 'Hash a file on this device instead',
    couldNotRead: 'Could not read that file.',
  },

  registry: {
    title: 'Dome Registry',
    lead: (net: string) =>
      `Fingerprints of files confirmed as malicious. Each one was approved by several independent curators and recorded on ${net}, so anyone can check it without trusting Dome.`,
    contract: 'Contract',
    loading: 'Loading indicators…',
    campaignLabel: 'Campaign',
    allCampaigns: (n: number) => `All campaigns (${n})`,
    empty: 'No active indicators yet.',
    caption: 'Active indicators',
    columns: { kind: 'Kind', value: 'Fingerprint or name', campaign: 'Campaign' },
    loadMore: 'Load more',
    sample: (n: number) => `a sample of ${n} listed fingerprints`,
    footnote:
      "This list comes from the Dome API's index of the ledger. Open an indicator to see its approvals and full on-chain record. Listing proposed and retracted indicators is planned.",
  },

  indicator: {
    title: 'Indicator',
    back: '← Registry',
    subject: 'this indicator',
    status: 'Status',
    active: 'Active',
    knownBad: 'known bad',
    campaign: 'Campaign',
    evidence: 'Evidence',
    ledger: 'Ledger',
    transaction: 'Transaction',
    notAvailable: 'Not available',
    notActive: 'Not an active indicator.',
    notActiveBody:
      'No active entry in the Dome Registry has this fingerprint. It may never have been proposed, may still be waiting for approvals, or may have been retracted.',
    onLedger: 'On the ledger',
    kind: 'Kind',
    proposed: 'Proposed',
    approvals: 'Approvals',
    evidenceHash: 'Evidence hash',
    retractedBy: 'Retracted by',
    reasonHash: 'Reason hash',
    statusText: {
      proposed: 'Proposed: waiting for more curator approvals. Not yet treated as known bad.',
      active: 'Active: approved by enough curators. Treated as known bad.',
      retracted: 'Retracted: a curator withdrew it. Kept visible so the mistake stays on record.',
    } as Record<string, string>,
    unknownStatus: 'Unknown status',
  },

  repo: {
    viewOnGitHub: 'View on GitHub',
    notScanned: 'Dome has not scanned this repository yet.',
    checkNow: 'Check it now',
    noAttestation: 'No on-chain attestation has been published for this repository yet.',
    latestScan: 'Latest scan',
    noFinishedScan: 'No finished scan yet.',
    startOne: 'Start one',
    attestationHeading: 'On-chain attestation',
    subject: 'this attestation',
    verdict: 'Verdict',
    commit: 'Commit',
    attester: 'Attester',
    recorded: 'Recorded',
    reportHash: 'Report hash',
    otherCommit: 'This attestation is for a different commit from the latest scan below.',
    check: {
      match: '✓ The report below hashes to the value recorded on chain.',
      mismatch: '✗ The report below does not match the hash recorded on chain. Treat this result with suspicion.',
      unavailable: 'The report could not be compared with the chain.',
    },
  },

  dashboard: {
    title: 'Maintainer dashboard',
    lead: 'Follow the latest Dome result for the repositories you maintain, and set up scanning on every pull request.',
    signInSoon: 'GitHub sign-in is coming.',
    signInSoonBody:
      'Once the Dome GitHub App supports it, this page will list your repositories and their scan history automatically. Until then, add repositories by hand; the list is saved only in this browser.',
    reposHeading: 'Your repositories',
    addLabel: 'Add a public repository',
    addPlaceholder: 'owner/repo',
    add: 'Add',
    invalid: 'Enter a public GitHub repository, like owner/repo.',
    empty: 'No repositories yet. Add one you maintain to see its latest result here.',
    caption: 'Followed repositories and their latest Dome result',
    columns: { repo: 'Repository', result: 'Latest result', scanned: 'Scanned', chain: 'On chain', actions: 'Actions' },
    loading: 'Loading…',
    couldNotLoad: 'Could not load',
    scanStatus: (status: string) => `Scan ${status}`,
    notScannedYet: 'Not scanned yet',
    published: 'Published',
    remove: 'Remove',
    removeLabel: (name: string) => `Stop following ${name}`,
    actionHeading: 'Scan every pull request',
    actionIntro:
      'Add the Dome GitHub Action so every pull request is scanned before anyone checks it out. It runs on `pull_request` with a read-only token, so a fork cannot use it to reach your secrets.',
    actionSteps: {
      save: 'Save this file as `.github/workflows/dome.yml`.',
      pin: 'Replace `REPLACE_WITH_RELEASE_SHA` with the commit SHA of the latest Dome Action release. The Action has not had its first release yet; follow the [dome-backend repository](https://github.com/DOME-security/Dome-backend).',
      mode: 'Start with `mode: report` for a week, then switch to `enforce`.',
    },
    workflowLabel: 'Workflow file',
    copy: 'Copy',
    copied: 'Copied',
    hardeningBefore: 'Then follow the',
    hardeningLink: 'hardening guide',
    hardeningAfter: ': rulesets, signed commits and CODEOWNERS.',
  },

  curate: {
    title: 'Curator console',
    lead: 'Curators add fingerprints of confirmed malicious files to the Dome Registry. An indicator only becomes active after several curators approve it, so one mistaken or stolen key cannot add a file on its own.',
    oneTx:
      'Each button builds exactly one transaction and shows you what it does before your wallet asks you to sign. Dome never asks for, sees or stores your secret key.',
    viewContract: 'View the registry contract',
    networkLegend: 'Network',
    defaultSuffix: ' (default)',
    mainnetNotDeployed: 'The mainnet registry is not deployed yet; it waits for an independent review.',
    mainnetWarning: 'Mainnet transactions are real and permanent.',
    mainnetWarningBody: 'They cost real XLM and every curator action is public forever. Practise on testnet first.',
    mainnetAck: 'I understand and want to act on mainnet',
    walletNotInstalled: (name: string) => `${name} is not installed in this browser.`,
    walletInstallBefore: 'Install it from',
    walletSite: 'freighter.app',
    walletInstallAfter:
      ', create a testnet account, then reload this page. Use a browser profile with no wallet holding real funds.',
    connect: (name: string) => `Connect ${name}`,
    waitingForWallet: 'Waiting for the wallet…',
    account: 'Account',
    walletNetwork: 'Wallet network',
    unknownNetwork: 'A network Dome does not use',
    networkMismatch: (wallet: string, expected: string, name: string) =>
      `Your wallet is set to ${wallet}, but this console is on ${expected}. Switch the network in ${name} before signing.`,
    anotherNetwork: 'another network',
    connectFailed: (name: string) => `The wallet did not connect. Open ${name}, unlock it and try again.`,
    sent: 'Sent.',
    sentOn: (net: string) => `The transaction is on ${net}.`,
    viewSent: 'View it on stellar.expert',
    actionLegend: 'Action',
    actions: { propose: 'Propose an indicator', approve: 'Approve an indicator', retract: 'Retract an indicator' },
    describe: {
      propose: (kind: string, campaign: string) =>
        `Propose a new known-bad file (${kind}, campaign "${campaign}"). Your proposal counts as the first approval; it becomes active only after other curators approve it.`,
      approve: 'Approve this indicator. It becomes active, and is treated as known bad, once enough curators have approved it.',
      retract:
        'Retract this indicator. It stops being treated as known bad but stays visible on the ledger as retracted, with your reason hash.',
    },
    fileHash: 'File fingerprint (SHA-256)',
    fileHashHint: 'The fingerprint of the malicious file.',
    kind: 'Kind of file',
    campaign: 'Campaign label',
    campaignHint: 'Lowercase, e.g. polinrider or unknown. Labels describe attacks, never people.',
    evidenceHash: 'Evidence hash (SHA-256)',
    evidenceHint: 'Publish the advisory or write-up first, then use the SHA-256 of that document.',
    reasonHash: 'Reason hash (SHA-256)',
    reasonHint: 'Publish a short retraction notice first, then use the SHA-256 of that notice.',
    review: 'Review transaction',
    preparing: 'Preparing…',
    errors: {
      hash: 'Enter the SHA-256 fingerprint of the file.',
      reason: 'Enter the SHA-256 of the published retraction notice.',
      campaign: 'Campaign labels are 1–32 characters: lowercase letters, digits and hyphens.',
      evidence: 'Enter the SHA-256 of the published advisory or write-up.',
      notConfigured: (net: string) => `The registry is not configured for ${net} in this build.`,
      confirmMainnet: 'Confirm that you want to act on mainnet first.',
      connect: 'Connect your wallet first.',
      switchNetwork: 'Switch your wallet to the same network first.',
      notCurator: (net: string) => `This account is not a curator on ${net}. The registry would reject the transaction.`,
      declined: 'The wallet did not sign. Nothing was sent.',
      failed: 'The transaction could not be prepared or sent. Nothing was charged unless a transaction hash is shown.',
    },
    summary: {
      heading: 'Check before you sign',
      action: 'Action',
      hash: 'Indicator hash',
      kind: 'Kind',
      evidence: 'Evidence hash',
      reason: 'Reason hash',
      network: 'Network',
      signer: 'Signed by',
      fee: 'Maximum fee',
      feeValue: (xlm: string, testnet: boolean) => `${xlm} XLM${testnet ? ' (testnet XLM, no real value)' : ''}`,
      advice:
        'Your wallet will show the same transaction. Sign only if both match. Dome never asks for your secret key or recovery phrase.',
      sign: 'Sign and send',
      cancel: 'Cancel',
    },
  },
};

export type Messages = typeof en;
