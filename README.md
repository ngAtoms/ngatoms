<p align="center">
  <a href="https://ngatoms.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/ngAtoms/ngatoms/main/apps/docs/src/assets/ngatoms-logo-w.svg" width="160" />
      <img src="https://raw.githubusercontent.com/ngAtoms/ngatoms/main/apps/docs/src/assets/ngatoms-logo-b.svg" width="160" alt="NgAtoms" />
    </picture>
  </a>
</p>

<h1 align="center">NgAtoms</h1>

<p align="center">Angular UI primitives you own.<br/>No runtime dependency — copy components directly into your project.</p>

<p align="center">
  <a href="https://ngatoms.com"><img src="https://img.shields.io/badge/docs-ngatoms.com-blue" alt="Documentation" /></a>
  <a href="https://www.npmjs.com/package/ngatoms"><img src="https://img.shields.io/npm/v/ngatoms?label=npm" alt="npm version" /></a>
  <img src="https://img.shields.io/badge/Angular-22+-red" alt="Angular 22+" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license" />
</p>

---

## What is NgAtoms

NgAtoms is a set of Angular UI components that you copy into your own project instead of installing as a dependency. A small CLI downloads the source of each component, so the code is yours to read, change and keep. There is no runtime package to update and no library API to wait on.

NgAtoms is MIT-licensed and will always be free.

Documentation and live previews: **[ngatoms.com](https://ngatoms.com)**.

## Quick Start

```bash
# 1. Initialize your project
npx ngatoms init

# 2. Add a component
npx ngatoms add button
```

`init` creates `ngatoms.json` (config), a default theme file, and wires it into your styles.
`add <component>` fetches the component source from GitHub and copies it into your `componentsDir`.

## Requirements

- Angular 22 or later (`@angular/core` and `@angular/common` `>=22.0.0`)
- Node.js 22.22.3, 24.15 or 26 and later (required by Angular 22)

## Components

Components are marked `stable` or `alpha`.

| Component | Description | Status |
|-----------|-------------|--------|
| `accordion` | Collapsible items, single or multiple mode | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `alert` | Feedback messages — 5 variants | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `avatar` | Image with fallback initials or icon | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `badge` | Labels — 8 variants: default, ember, success, warning, destructive, info, solid, outline | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `button` | 5 variants, 5 sizes, loading state, icon support | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `card` | Container with header, content, footer slots | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `checkbox` | Checked, unchecked, and indeterminate states | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `date-picker` | Custom calendar overlay — single/range, min/max, i18n, month/year picker | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `dialog` | Modal using native `<dialog>`, focus trap, backdrop | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `dropdown-menu` | Contextual action menu — 4 placements, flip, icons, keyboard navigation | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `input` | 3 variants, 5 sizes, invalid state | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `number-input` | Numeric input with increment/decrement controls | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `overlay` | Shared overlay plumbing, installed automatically with the components that need it | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `popover` | Floating content anchored to a trigger — 4 placements, flip | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `progress` | Progress bar — determinate and indeterminate | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `radio-group` | Radio button group with keyboard navigation | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `select` | Custom select list — 3 variants, 5 sizes, invalid state | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `separator` | Horizontal or vertical divider | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `spinner` | Loading spinner | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `switch` | Toggle switch — 3 sizes | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `tabs` | Underline and pills variants, keyboard navigation | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `textarea` | Multiline input with auto-resize | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `tooltip` | Floating label — 4 placements, viewport clamping | ![stable](https://img.shields.io/badge/stable-green?style=flat-square) |
| `grid` | Data grid with tree rows, column groups, pinned columns, filters, sorting, editing, range selection and virtualization | ![alpha](https://img.shields.io/badge/alpha-yellow?style=flat-square) |
| `grid-core` | Framework-free models behind the grid, installed automatically with it | ![alpha](https://img.shields.io/badge/alpha-yellow?style=flat-square) |

**Stability.** The public API of a `stable` component follows semver: it changes only in a major release. A component marked `alpha` is outside semver and can change in a minor or patch release. Today that is `grid` and `grid-core`, including the exported helpers `fillDownChanges` and `fillFromChanges`.

## Design tokens

The colors, spacing, radii, shadows, fonts and other design values are CSS variables (prefixed `--nga-`), published as [`@ngatoms/ngatoms-tokens`](https://www.npmjs.com/package/@ngatoms/ngatoms-tokens). The theme file that `init` creates contains them, so you can restyle the components by changing variables.

## Configuration

`init` writes `ngatoms.json`:

```json
{
  "componentsDir": "src/components",
  "stylesFile": "src/styles.css",
  "themes": ["src/themes/default.css"]
}
```

## Monorepo structure

```
ngatoms/
├─ packages/
│  ├─ ngatoms        # Published CLI
│  ├─ primitives     # Angular UI primitive components
│  ├─ tokens         # Design tokens / CSS variables
│  ├─ cli            # Placeholder, not published
│  └─ utils          # Shared utilities
├─ apps/
│  ├─ docs           # Documentation site → ngatoms.com
│  └─ example        # Example app
├─ registry/         # Component registry metadata
└─ tools/            # Build and publishing scripts
```

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first. In short:

```bash
npm install
npm run build
npm run test
npm run lint
```

Open pull requests against `rc`. Every pull request that changes a published package needs a changeset:

```bash
npm run changeset
```

Releases are described in [RELEASING.md](RELEASING.md).

## Release channels

| Branch | npm tag | Description |
|--------|---------|-------------|
| `main` | `latest` | Stable |
| `lts` | `lts` | Long-term support |
| `rc` | `rc` | Release candidate |

## License

[MIT](LICENSE). NgAtoms is MIT-licensed and will always be free.
