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

Packages that publish today: `ngatoms` and `@ngatoms/ngatoms-tokens`. The release job installs npm 12 before staging so the CLI can use OIDC. `id-token: write` is already set on the job.

## Changesets

Every PR that modifies a publishable package must include a changeset:

```bash
npm run changeset
```

Select the affected packages and bump type (patch / minor / major). Commit the generated `.changeset/` file with your changes.

## Release Channels

| Branch | Channel | Example version |
|--------|---------|----------------|
| `main` | stable | `1.2.0` |
| `alpha` | alpha | `1.2.0-alpha.0` |
| `beta` | beta | `1.2.0-beta.0` |
| `rc` | release candidate | `1.2.0-rc.0` |

## Stable Release (`main`)

Merge to `main`. CI will automatically:

1. Open a version PR that bumps packages and updates changelogs
2. On merge of the version PR — publish packages and create a GitHub release

## Preview Releases (`alpha` / `beta` / `rc`)

Push to the corresponding branch. CI will version and publish immediately to the matching npm tag.

```bash
npm install ngatoms@alpha
npm install ngatoms@beta
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
npm run publish:alpha:dry

# Publish
npm run publish:latest
npm run publish:alpha
```