# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Workflow

- NEVER add Co-Authored-By lines to commits unless explicitly asked
- Follow branch promotion flow: `rc` → `lts` → `main`. NEVER merge or commit directly to `main`
- Always create PRs for changes; do not push directly to protected branches

## Code Standards

These apply to all TypeScript in the library and are enforced by ESLint for everything under `packages/primitives/src`.

- **KISS** — pick the simplest design that solves the problem in front of you. No speculative options, layers, or abstractions.
- **SOLID** — one reason to change per function, class, and file. Depend on small interfaces (see the `InjectionToken` context pattern), not on concrete classes.
- **Clean Code** — intention-revealing names, small functions, no dead code, no magic numbers (name the constant).
- **No inline comments.** `//` comments are not allowed in TypeScript. If code needs explaining, first make it clearer (rename, extract a function); what still needs saying goes in the JSDoc header.
- **Every file starts with a header**: a JSDoc block with `@file` stating what the file is responsible for.
- **Every function, method, and class has a JSDoc header.** Keep it clean, correct, and pragmatic: say what it does and why it exists, plus any non-obvious behavior. Do not restate the signature, and do not add `@param`/`@returns` lines that only repeat names and types. Methods implementing an interface may use `/** @inheritdoc */`. An arrow function written inline to fill in a documented interface member (a callback in an options object) needs no JSDoc of its own: the member's documentation is the documentation.
- Interface members are documented with JSDoc where the name alone is not enough.

## Keyboard Shortcuts

- **Every shortcut is documented for Windows/Linux and for macOS.** A component page that has keyboard shortcuts carries a table with three columns — action, Windows / Linux, macOS — and prose that names a shortcut gives both forms (`Ctrl+C`, `⌘C` on a Mac).
- The Mac form is not always a different modifier. `Ctrl` is `⌘`, `Alt` is `⌥`, `Enter` is `Return`; `Home` / `End` are `Fn+←` / `Fn+→` and `Page Up` / `Page Down` are `Fn+↑` / `Fn+↓` on keyboards without those keys; `Delete` is `Fn+Delete`.
- **Code accepts both.** A shortcut on `Ctrl` also answers to `⌘` (`event.ctrlKey || event.metaKey`). Do not bind a shortcut the browser or the system already owns on either platform (`Ctrl+R`, `⌘W`, `⌘Q`…).
- JSDoc that lists shortcuts follows the same rule.

## Project Overview

**NgAtoms** is a collection of Angular UI primitives designed to be copied directly into projects rather than installed as a library dependency. Core philosophy: no runtime UI dependencies, full project control.

## Monorepo Structure

npm workspaces monorepo with the following packages:

| Package | Name | Purpose |
|---|---|---|
| `packages/ngatoms` | `ngatoms` | Published CLI (`npx ngatoms`) |
| `packages/cli` | `@ngatoms/ngatoms-cli` | Placeholder. The published CLI is `packages/ngatoms` |
| `packages/primitives` | `@ngatoms/ngatoms-primitives` | Angular UI primitive components |
| `packages/tokens` | `@ngatoms/ngatoms-tokens` | Design tokens / CSS variables |
| `packages/utils` | `@ngatoms/ngatoms-utils` | Shared utilities |
| `apps/docs` | `@ngatoms/ngatoms-docs` | Angular 22 interactive docs — deployed to `ngatoms.com` via Cloudflare Pages |
| `registry/` | — | Component registry metadata (`registry.json`) |

## Common Commands

```bash
# Install all workspace dependencies
npm install

# Build all packages
npm run build

# Run all tests
npm run test

# Lint all packages
npm run lint

# Run a single workspace's script
npm run build --workspace=packages/primitives
npm run test --workspace=packages/utils
```

## Release & Versioning

Versioning is managed via [Changesets](https://github.com/changesets/cli).

```bash
# Create a changeset before merging a PR
npm run changeset

# View changeset status
npm run status:changesets

# Version packages (from changesets)
npm run version:packages

# Publish (dry run first)
npm run publish:latest:dry
npm run publish:latest

# LTS channel
npm run publish:lts:dry
npm run publish:lts

# RC channel
npm run publish:rc:dry
npm run publish:rc
```

**PRs that modify publishable packages (`packages/*` or `registry/`) require a changeset file** — enforced by CI.

## Changesets

- Always include a changeset (`npm run changeset`) for any publishable package modification. Do not wait for the user to remind you.

## Release Channels

The project supports multiple release channels via branch strategy:

| Branch | Channel | npm tag |
|---|---|---|
| `main` | Stable | `latest` |
| `lts` | Long-term support | `lts` |
| `rc` | Release candidate | `rc` |

## Deployment

- **Cloudflare Pages** (current): `apps/docs` is deployed via Cloudflare Pages on push to `main`. Build command: `npm run build --workspace=apps/docs`. Output: `apps/docs/dist/browser`. Config in `wrangler.toml`.
- `wrangler.toml` uses `[assets]` with `directory = "apps/docs/dist/browser"`. Keep that. Do not switch it to `pages_build_output_dir` unless the deploy target changes.
- Do not add `<base href>` other than `/` to `apps/docs/src/index.html`.

## npm Publishing

- CI stages releases with npm trusted publishing (GitHub Actions OIDC) from `.github/workflows/release.yml`. A maintainer approves each version with 2FA. Do not add an npm token, do not enable direct `npm publish` on the trusted publisher, and do not use a 2FA-bypass granular access token.

## CI/CD

GitHub Actions workflows:

- **release.yml** — Unified CI + release pipeline. Runs lint/test/build on every PR and push; publishes to the matching npm tag (`latest`/`lts`/`rc`) on push to `main`/`lts`/`rc`.
- **changeset-required.yml** — Fails PRs that modify `packages/*` or `registry/` without a `.changeset/*.md` entry.
- **delete-merged-branch.yml** — Auto-deletes feature branches after PR merge (protects `main`, `lts`, `rc`).

Node version: **22.x**

## Architecture Notes

- All packages use **TypeScript + ES modules** (`"type": "module"`)
- Scoped packages use the `@ngatoms/` namespace
- Each package explicitly declares its `files` array — only those files are published
- The `registry/registry.json` is the component registry that the CLI reads from; it lists available components with metadata
- Design tokens in `packages/tokens` are distributed as CSS variables
- The CLI people run is `packages/ngatoms` (`bin/cli.js`, command `ngatoms`). `packages/cli/bin/ngatoms.js` only prints a placeholder.