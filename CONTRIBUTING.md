# Contributing

## Scope

This repository contains an MCP server for Solace SEMP. Contributions should preserve three things:

- predictable tool behavior
- safe handling of write and delete operations
- clear operational documentation

## Development Setup

1. Install dependencies:

```bash
npm install
```

2. Create local broker configuration if you need to exercise real brokers:

```bash
copy brokers.json.example brokers.json
```

3. Run the test suite:

```bash
npm test
```

4. Build before opening a pull request:

```bash
npm run build
```

## Branching

- Create a short-lived branch from the current main development branch
- Keep one logical change per pull request
- Prefer small PRs over broad refactors

## Coding Expectations

- Use TypeScript only for source changes under `src/`
- Keep runtime behavior explicit and boring
- Do not expose broker credentials in logs, responses, or tests
- Preserve dry-run behavior for state-changing tools unless the change is deliberate and documented
- Add or update tests when changing tool behavior, transport behavior, broker loading, or safety rules

## Testing Expectations

At minimum, run:

```bash
npm test
npm run build
```

Add focused Jest coverage for:

- new tool handlers
- changed request/response behavior
- new safety confirmation logic
- transport or configuration changes

## Documentation Expectations

Update docs when you change:

- setup or configuration
- public tool names or semantics
- environment variables
- deployment or runtime behavior
- versioning or release policy

## Pull Request Checklist

- Code builds successfully
- Tests pass locally
- New behavior is covered by tests where practical
- README or supporting docs are updated
- No secrets are committed
- Breaking changes are clearly called out

## Reporting Issues

When filing a bug, include:

- runtime mode: `stdio` or `sse`
- Node.js version
- exact tool invoked
- broker version if relevant
- redacted logs or error output

## Security

Do not open public issues with real broker URLs, usernames, passwords, API keys, or payload data. Share redacted examples only.
