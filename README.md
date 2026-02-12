# @flyingboat/upup

CLI tool to check dependency versions in a project and show which ones are outdated.

## Install (global)

```
npm install -g @flyingboat/upup
pnpm add -g @flyingboat/upup
```

or via npx:
```
npx @flyingboat/upup
pnpm dlx @flyingboat/upup
```

## Usage

Run in the current project:

```
upup
```

## Flags

- `--ci`: Run in CI mode, disabling animations
- `--compact`: Render the result in a compact format
- `--export-to-file`: Export the result to a file instead of printing it to stdout