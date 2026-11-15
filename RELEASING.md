# Releasing NgAtoms

NgAtoms uses **Changesets + GitHub Actions** for automated releases. Publishing uses npm trusted publishing (OIDC). The release job does not use an npm token.

## Trusted publisher

Direct publish from a 2FA-bypass granular token is being removed. Each public package needs a trusted publisher on npmjs.com, created while signed in with 2FA:

| Field | Value |
|---|---|
| Organization or user | `ngAtoms` |
| Repository | `ngatoms` |
| Workflow filename | `release.yml` |
| Allowed action | leave direct `npm publish` unchecked |

`npm stage publish` is always allowed. Leave direct publish unchecked so the workflow cannot skip approval. The release job stages each package with the channel tag (`latest`, `lts`, or `rc`). A version becomes public only after a maintainer approves it with 2FA, on the package's Staged Packages tab or with `npm stage approve <stage-id>`.

A new trusted publisher must complete its first successful stage within 2 days.

`ngatoms` is `1.0.0-rc.1`. Every other workspace package is `1.0.0-rc.0`. Only these two are published:

| Package | npm name | Why it publishes |
|---|---|---|
| `packages/ngatoms` | `ngatoms` | The CLI people run with `npx ngatoms` |
| `packages/tokens` | `@ngatoms/ngatoms-tokens` | The design tokens |

These stay private, at `1.0.0-rc.0`:

| Package | Why it stays private |
|---|---|
| `packages/primitives` | Components are copied into the consumer project. They are not a runtime dependency. |
| `packages/cli` | Placeholder. The published CLI is `ngatoms`. |
| `packages/utils` | Empty shared module. No public API yet. |
| `apps/docs` | The documentation site. It deploys to ngatoms.com, not to npm. |

The release job installs npm 12 before staging so the CLI can use OIDC. `id-token: write` is already set on the job.

## Changesets

Every PR that modifies a publishable package must include a changeset:

```bash
npm run changeset
```

Select the affected packages and bump type (patch / minor / major). Commit the generated `.changeset/` file with your changes.

## Release Channels

| Branch | Channel | npm tag |
|--------|---------|---------|
| `main` | stable | `latest` |
| `lts` | long-term support | `lts` |
| `rc` | release candidate | `rc` |

The workflow and the `publish:latest`, `publish:lts`, and `publish:rc` scripts use these three tags. There is no `alpha` or `beta` channel.

## Stable Release (`main`)

Push to `main`. The release workflow, after CI passes:

1. Runs `changeset version` and commits the version bump on that branch
2. Stages the packages for npm approval with 2FA. It does not publish them directly

## Preview Releases (`lts` / `rc`)

Push to `lts` or `rc`. The release workflow versions packages and stages them on the matching npm tag. `main` stages `latest`. A version is not public until a maintainer approves the stage.

```bash
npm install ngatoms@lts
npm install ngatoms@rc
```

## Manual Commands

These are available if you need to run steps locally:

```bash
# Preview what will be versioned
npm run status:changesets

# Version packages from changesets
npm run version:packages

# Dry run before publishing
npm run publish:latest:dry
npm run publish:lts:dry
npm run publish:rc:dry

# Publish
npm run publish:latest
npm run publish:lts
npm run publish:rc
```