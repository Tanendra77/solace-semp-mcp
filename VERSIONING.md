# Versioning

This repository uses Semantic Versioning.

Version format:

```text
MAJOR.MINOR.PATCH
```

## Rules

- Increment `PATCH` for backward-compatible bug fixes, test-only fixes, and documentation corrections
- Increment `MINOR` for backward-compatible new tools, new configuration options, or additive server capabilities
- Increment `MAJOR` for breaking changes to tool names, tool inputs, tool outputs, transport behavior, configuration requirements, or safety defaults

## Examples

- `1.0.1`: fix pagination bug without changing the public tool contract
- `1.1.0`: add new broker diagnostic tools
- `2.0.0`: rename tools, remove a transport mode, or change confirmation semantics

## What Counts As Breaking

The following should be treated as breaking:

- renaming or removing an MCP tool
- changing a tool input field name or requiredness
- changing a response format in a way clients depend on
- changing default transport behavior
- changing environment variable behavior incompatibly
- relaxing safety in a way that removes confirmation steps

## Release Process

1. Update the version in [package.json](./package.json)
2. Update docs if public behavior changed
3. Run:

```bash
npm test
npm run build
```

4. Create a tagged release using the same version number

## Pre-1.0 Note

If the project re-enters an unstable phase in the future, document any deviations from SemVer in this file before release.
