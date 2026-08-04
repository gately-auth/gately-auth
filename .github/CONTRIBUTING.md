# Contributing to gately-auth

Thanks for your interest in contributing! This is an open-source project and we welcome contributions of all kinds — bug fixes, new features, documentation improvements, and tests.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Commit Convention](#commit-convention)
- [Releasing](#releasing)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating you agree to uphold this standard. Please report unacceptable behaviour to **security@usegately.com**.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 9 (`npm install -g pnpm`)
- **Wrangler** ≥ 3 for Cloudflare Worker testing (`npm install -g wrangler`)

### Setup

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/gately-auth.git
cd gately-auth

# 2. Install dependencies
pnpm install

# 3. Build all packages
pnpm build

# 4. Run the test suite
pnpm test
```

---

## Project Structure

```
gately-auth/
├── packages/
│   ├── core/           # @gately-auth/core — Worker handler, adapters, providers
│   ├── client/         # @gately-auth/client — Browser/React/Vue/Svelte client
│   └── cli/            # @gately-auth/cli — gately-auth CLI tool
├── examples/
│   ├── basic-worker/   # Standalone Hono Worker example
│   └── nextjs/         # Next.js frontend example
├── .github/
│   ├── CONTRIBUTING.md (this file)
│   ├── ISSUE_TEMPLATE/
│   └── workflows/
└── docs/               # Documentation source
```

### Package overview

| Package | Description |
|---|---|
| `@gately-auth/core` | The auth engine — D1 adapter, KV adapter, all providers, session management, plugins |
| `@gately-auth/client` | Client SDK — `createAuthClient()`, `useSession()`, React hooks |
| `@gately-auth/cli` | CLI tool — `gately-auth init`, `migrate`, `generate`, `deploy` |

---

## Development Workflow

### Building

```bash
# Build a single package
pnpm --filter @gately-auth/core build

# Build everything
pnpm build

# Watch mode (all packages)
pnpm dev
```

### Testing

```bash
# Run all tests once
pnpm test

# Watch mode
pnpm test:watch

# Test a single package
pnpm --filter @gately-auth/core test
```

Tests use [Vitest](https://vitest.dev/) and run entirely in Node.js — no Cloudflare emulation needed for unit tests. Integration tests that need D1/KV use the in-memory adapters from `packages/core/src/adapters/kv.ts`.

### Type checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
```

---

## Submitting a Pull Request

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/my-feature
   # or: fix/some-bug, docs/update-readme, etc.
   ```

2. **Make your changes** — keep them focused. One logical change per PR.

3. **Write or update tests** for your changes.

4. **Run the full suite** before pushing:
   ```bash
   pnpm build && pnpm typecheck && pnpm test
   ```

5. **Create a changeset** if your change affects a published package:
   ```bash
   pnpm changeset
   ```
   This will prompt you to describe the change and select which packages are affected.

6. **Open a PR** against the `main` branch. Fill in the PR template.

### PR checklist

- [ ] Tests pass locally (`pnpm test`)
- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] Changeset created if package code changed (`pnpm changeset`)
- [ ] Docs updated if behaviour changed
- [ ] No `console.log` left in production code
- [ ] No secrets or credentials in the diff

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

**Types:**

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `test` | Adding or fixing tests |
| `refactor` | Code change that isn't a fix or feature |
| `chore` | Tooling, dependencies, CI changes |
| `perf` | Performance improvement |
| `security` | Security fix |

**Examples:**

```
feat(core): add TOTP two-factor authentication plugin
fix(client): handle missing Set-Auth-Token header gracefully
docs: add Svelte integration example
chore: upgrade vitest to 2.1.0
```

---

## Releasing

Releases are managed with [Changesets](https://github.com/changesets/changesets).

Maintainers trigger releases by running:

```bash
pnpm changeset version  # bump versions based on changesets
pnpm release            # build + publish to npm
```

The GitHub Actions workflow at `.github/workflows/release.yml` handles this automatically when PRs are merged to `main`.

---

## Questions?

- Open a [GitHub Discussion](https://github.com/gately-auth/gately-auth/discussions) for questions and ideas
- Open an [Issue](https://github.com/gately-auth/gately-auth/issues) for bugs
- Join the [Gately Discord](https://discord.gg/gately) for real-time help
