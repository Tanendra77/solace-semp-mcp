# Publishing `@tanendra77/solace-semp-mcp` to npm

## Prerequisites

- Node.js and npm installed
- npm account: `your account`
- Logged in to npm CLI

---

## 1. Login to npm

```bash
npm login
```

Enter username `username`, password, and email when prompted.
Verify you are logged in:

```bash
npm whoami
# → username
```

---

## 2. Pre-publish checks

```bash
# Clean build
npm run build

# All tests pass
npm test
```

Both must succeed before publishing.

---

## 3. Verify what will be published

```bash
npm pack --dry-run
```

This shows exactly which files will be included (only `dist/` due to the `files` field in `package.json`). Expected output:

```
dist/index.js
dist/index.d.ts
dist/index.js.map
dist/setup.js
dist/setup.d.ts
dist/setup.js.map
dist/brokers/...
dist/semp/...
dist/tools/...
dist/transport/...
dist/safety/...
dist/logger.js
dist/server.js
```

`src/`, `tests/`, `docs/`, `brokers.json` must NOT appear in this list.

---

## 4. Bump the version

Follow [semver](https://semver.org):

| Change type | Command | Example |
|-------------|---------|---------|
| Bug fix | `npm version patch` | `1.0.0` → `1.0.1` |
| New feature | `npm version minor` | `1.0.0` → `1.1.0` |
| Breaking change | `npm version major` | `1.0.0` → `2.0.0` |

This updates `package.json` and creates a git tag automatically.

---

## 5. Publish

**First publish** (scoped packages need `--access public` once):

```bash
npm publish --access public
```

**All subsequent publishes:**

```bash
npm publish
```

---

## 6. Verify the publish

```bash
npm view @tanendra77/solace-semp-mcp
```

Check the version, bin, and files fields match what you expect.

Test it live:

```bash
npx @tanendra77/solace-semp-mcp setup --global
```

---

## 7. Test locally before publishing

To test the CLI without publishing:

```bash
# Build first
npm run build

# Link globally
npm link

# Now test as if installed
solace-semp-mcp setup --global

# Unlink when done
npm unlink -g @tanendra77/solace-semp-mcp
```

---

## 8. Push the version tag to GitHub

After `npm version` creates a tag:

```bash
git push && git push --tags
```

---

## Quick reference

```bash
npm run build && npm test          # verify
npm version patch                  # bump version
npm publish --access public        # first publish
npm publish                        # subsequent publishes
git push && git push --tags        # push tag to GitHub
```
