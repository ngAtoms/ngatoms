# Releasing NgAtoms

NgAtoms uses **Changesets + GitHub Actions**. Publishing uses npm trusted publishing (OIDC) and **staged publishing**: the release job does not use an npm token, and a version becomes public only after a maintainer approves it with 2FA.

## How a release works

One workflow, `.github/workflows/release.yml`, handles every channel. On a **push** to `main`, `lts` or `rc` the `release` job runs these steps, in order:

1. **CI** (`ci` job): lint, test and build. A pull request to those branches runs only this job.
2. **Pin CLI source**: `node packages/ngatoms/scripts/pin-source.mjs`, then `--check`. The CLI downloads source pinned to this commit.
3. **Version packages**: `npm run version:packages` (`changeset version`). On `lts` the job first enters LTS pre-release mode.
4. **Commit version bump**: `chore: version packages`.
5. **Check pin still matches**: the version bump must not change the files the pin hashed (`registry`, `packages/tokens/src`, `packages/primitives/src`), then `pin-source.mjs --check` again.
6. **Stage packages for approval**: `npm run publish:changesets` through the stage wrapper, which runs `npm stage publish` with the channel tag. Nothing is public yet.
7. **Push**: `git push --follow-tags` of the version commit and the tags to the same branch.

The `main` branch no longer opens a version pull request. The job versions and stages on the push itself.

### Approve the stage (2FA)

Each staged version is approved by a maintainer:

1. On npmjs.com, open the package and use the **Staged Packages** tab.
2. Or locally, after `npm login`: `npm stage list <package>`, then `npm stage approve <stage-id>`.

To drop a staged version that must not ship: `npm stage reject <stage-id>`.

If a push is made again before approval, the job stages the same version again. The wrapper treats "already staged" as done.

## Channels

| Branch | npm tag | Notes |
|---|---|---|
| `main` | `latest` | Stable. |
| `lts` | `lts` | The job enters LTS pre-release mode, then exits it after the push. |
| `rc` | `rc` while `.changeset/pre.json` exists, `latest` when it does not | `changeset publish` uses the `pre.json` tag in pre mode and `latest` outside it. Since 1.0.0, `rc` is out of pre mode, so a push to `rc` stages `latest`. In pre mode, a package with no normal release yet is published to `latest`. |

The `alpha` and `beta` branches have no release trigger today.

`1.0.0` shipped from `rc`: `changeset pre exit` was merged together with the last change, so the same job versioned `1.0.0` and staged it as `latest`. The merge commit (`65ed294`) started the job on push (run `43915500050`, success), the bot pushed `84ceb69` (`chore: version packages`) and the tags `ngatoms@1.0.0` and `@ngatoms/ngatoms-tokens@1.0.0`, and `.changeset/pre.json` is gone from `rc`. After that, a push to `main` finds `1.0.0` already published and does not version anything.

## Trusted publisher

Each public package needs a trusted publisher on npmjs.com, created while signed in with 2FA:

| Field | Value |
|---|---|
| Organization or user | `ngAtoms` |
| Repository | `ngatoms` |
| Workflow filename | `release.yml` |
| Environment | leave empty (the job does not declare one) |
| Allowed action | leave direct `npm publish` unchecked |

`npm stage publish` is always allowed. Leave direct publish unchecked so the workflow cannot skip approval. A new trusted publisher must complete its first successful stage within 2 days. Staging needs npm CLI 11.15.0 or later and Node 22.14.0 or later. The workflow uses Node 22 and installs `npm@12.2.2`.

Only these two packages are published:

| Package | npm name | Why it publishes |
|---|---|---|
| `packages/ngatoms` | `ngatoms` | The CLI people run with `npx ngatoms` |
| `packages/tokens` | `@ngatoms/ngatoms-tokens` | The design tokens |

These stay private, at the same version:

| Package | Why it stays private |
|---|---|
| `packages/primitives` | Components are copied into the consumer project. They are not a runtime dependency. |
| `packages/cli` | Placeholder. The published CLI is `ngatoms`. |
| `packages/utils` | Empty shared module. No public API yet. |
| `apps/docs` | The documentation site. It deploys to ngatoms.com, not to npm. |

## Changesets

Every PR that modifies a publishable package must include a changeset:

```bash
npm run changeset
```

Select the affected packages and bump type (patch / minor / major). Commit the generated `.changeset/` file with your changes.

Components marked alpha are outside semver: they can change in any release.

## Verify the staged tarball

Before approving a stage, compare the staged tarball with what was reviewed:

1. Download the staged tarball with `npm stage download <stage-id>`. List the ids with `npm stage list <package>`. Both need the owner's `npm login`, and neither needs 2FA. The release job log shows no stage id and no integrity. Check that `src/lib/source.json` has `commit` equal to the commit the job ran on (the merge commit, or the empty commit if the backup trigger was used).
2. If you pack locally to compare checksums, pack with the **same Node version as the runner** (see the `Setup Node` step in the job log) and `npm@12.2.2`, on Linux. This was tested for 1.0.0: a pack with Node 26 on macOS gave a different `shasum`; a pack with Node 22.23.4 on Linux (the runner's) gave exactly the `shasum` of the stage, and the contents were identical (`diff -r`). If the `shasum` still differs, extract both tarballs and compare them with `diff -r`.
3. Approve only after both checks.

## Backup trigger

If the merge does not start the release job, a maintainer can start it with an empty commit. It was not needed for 1.0.0, because the merge started the job on push; this is a reserve. Use it **only** when all of these are true:

1. At least 10 minutes have passed since the merge.
2. `gh run list --workflow release.yml --branch rc` shows **no push run** for the merge in any state: queued, in progress or completed. If a run is queued, wait for it.
3. `git pull --ff-only` on `rc` shows the version commit and tags from the bot are **not** there yet. If they are, do nothing.

Then push an empty commit on top of the merge (normal push, no force):

```bash
git fetch origin
git switch rc
git pull --ff-only origin rc
git commit --allow-empty -m "chore: trigger release"
git push origin rc
```

The job runs on that commit, whose tree is the same as the merge, and the pin points at it. Do not do this if a late run is still starting: the bot's `git push --follow-tags` would then fail (non-fast-forward) and leave a staged version with no version commit or tags.

A `workflow_dispatch` trigger is planned for a normal PR, so future releases have a manual trigger.

## Manual commands

These are available if you need to run steps locally:

```bash
# Preview what will be versioned
npm run status:changesets

# Version packages from changesets
npm run version:packages

# Dry run before publishing (also publish:lts:dry)
npm run publish:latest:dry
npm run publish:rc:dry

# Publish (also publish:lts)
npm run publish:latest
npm run publish:rc
```

These commands run `changeset version` and `changeset publish` directly. They publish directly, without the staging wrapper and without the pin, and they are untested. The `prepack` of `ngatoms` refuses to pack without a pin (`GITHUB_SHA=<commit> node packages/ngatoms/scripts/pin-source.mjs`). The normal route is the release job.
