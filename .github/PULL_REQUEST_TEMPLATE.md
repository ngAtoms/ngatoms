<!--
  Target branch: rc  (not main)
  PRs against main will be closed.
-->

## Summary

<!-- What does this PR do? Why? -->

## Type of change

- [ ] Bug fix
- [ ] New component
- [ ] Enhancement to existing component
- [ ] Docs update
- [ ] Chore / refactor

## Checklist

- [ ] PR targets the `rc` branch
- [ ] Tests pass (`npm run test`)
- [ ] Lint passes (`npm run lint`)
- [ ] Changeset included (`npm run changeset`) — required for changes to `packages/*` or `registry/`
- [ ] Docs updated if the component API or behavior changed

## Required approvals before merge
- [ ] InfoSec review: link to the report (reviewed commit SHA: ______)
- [ ] QA review: link to the report (reviewed commit SHA: ______)
- [ ] UI/UX review, if the PR changes visuals or interaction: link, or "N/A" confirmed by the design reviewer

If the PR changes after an approval, the reviewer re-checks the new commits before merge.
Without these approvals, the PR is not sent for merge.

## Security checklist

<!-- Tick each item, or write "N/A — reason". Do not leave items blank. -->

### All PRs
- [ ] No secrets, tokens, passwords, private keys or real personal data in the diff, commit messages, logs, screenshots or test fixtures. `.env` is not committed and was not opened.
- [ ] New or updated dependencies: listed below, with the reason, pinned through the lockfile, and checked with the free scanner for this repo (npm audit / osv-scanner / `dotnet list package --vulnerable`). No new paid tool.
- [ ] Input from outside the code (user input, network, files, URLs, clipboard, deep links) is validated or encoded where it is used.
- [ ] Errors and logs do not expose stack traces, tokens or personal or financial data.
- [ ] Changes to CI or GitHub workflows (`.github/`): no new secrets, no `pull_request_target` with checkout of PR code, third-party actions pinned to a commit SHA, `permissions:` kept minimal.
- [ ] No breaking change to a public API, or it is called out in the changeset and approved by the owner.
- [ ] Text in code comments or docs that reads like an instruction to a tool or AI is not added. Any found is reported, not followed.

Dependencies added or changed (name, version, why):

### ngAtoms only
- [ ] CLI and registry: nothing new is downloaded or executed at install or `add` time; any fetched file comes from a fixed version (tag or commit), not a moving branch.
- [ ] `registry.json`: `registryDependencies` match the imports (registry-deps test passes). No component copies files outside its own folder in the user's project.
- [ ] Templates and components: no `innerHTML`/`bypassSecurityTrust*`, no `eval`, no inline event strings built from input.
- [ ] Published files: the package `files` list did not grow to include tests, fixtures, source maps with secrets or local config.
- [ ] Changeset: present when required; no claims of screen-reader support or "accessible" in docs, comments or changelog.

Security notes for the reviewer (what changed, what was not checked):
